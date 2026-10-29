import type { SchoolService } from './service.ts';
import { SchoolError,type User,type Row } from './types.ts';
export function buildSchoolView(service:SchoolService,user:User|null,path:string,searchParams:URLSearchParams){
		const parts=path.split('/').filter(Boolean),staff=parts[0]==='staff',account=parts[0]==='account';
		if (
			!/^\/(?:directions(?:\/[^/]+)?|how-it-works|teacher|free-materials(?:\/[^/]+)?|faq|contacts|demo(?:\/[^/]+)?|legal\/(?:privacy|terms)|login|account(?:\/(?:courses|lessons|homework|schedule|materials|profile|children)(?:\/[^/]+)?)?|staff(?:\/(?:students|groups|courses|lessons|review|library|leads|schedule|settings)(?:\/[^/]+)?(?:\/(?:edit|preview))?)?)?$/.test(
				path,
			)
		)
			throw new SchoolError(404, 'Page not found');
		const result: Row = {
			path,
			user,
			settings: service.settings(),
			local: service.development,
			requestKey: crypto.randomUUID(),
			courses: [],
			items: [],
			query: Object.fromEntries(searchParams),
		};
		if (staff || account) {
			if (!user) throw new SchoolError(401,'Войдите в кабинет.');
			service.require(user, staff ? ['teacher', 'admin'] : ['student', 'parent']);
		}
		if (account && user) {
			if (parts[1] === 'children') service.require(user, ['parent']);
			if (
				user.role === 'parent' &&
				!service.db.one('SELECT 1 FROM school.guardians WHERE parent_id=?', user.id) &&
				[undefined, 'children', 'profile'].includes(parts[1])
			) {
				Object.assign(result, {
					children: [],
					courses: [],
					submissions: [],
					assignments: [],
					events: [],
					studentId: null,
				});
				return { school: result };
			}
			const studentId = service.student(user, searchParams.get('child') ?? undefined);
			result.studentId = studentId;
			result.children =
				user.role === 'parent'
					? service.db.all(
							'SELECT u.id,u.name FROM pd.users u JOIN school.guardians g ON g.student_id=u.id WHERE g.parent_id=?',
							user.id,
						)
					: [];
			result.courses = service.db.all(
				"SELECT c.*, (SELECT COUNT(*) FROM school.completions co JOIN school.lessons l ON l.id=co.lesson_id JOIN school.modules m ON m.id=l.module_id WHERE m.course_id=c.id AND co.student_id=?) completed, (SELECT COUNT(*) FROM school.lessons l JOIN school.modules m ON m.id=l.module_id WHERE m.course_id=c.id AND l.publication='published') total FROM school.courses c WHERE c.publication='published' AND EXISTS(SELECT 1 FROM school.entitlements e WHERE e.course_id=c.id AND e.student_id=? AND e.revoked_at IS NULL AND (e.expires_at IS NULL OR e.expires_at>?))",
				studentId,
				studentId,
				new Date().toISOString(),
			);
			result.assignments = service.db.all(
				"SELECT a.*,l.title,(SELECT s.id FROM school.submissions s WHERE s.lesson_id=l.id AND s.student_id=? ORDER BY attempt_no DESC LIMIT 1) submission_id FROM school.assignments a JOIN school.lessons l ON l.id=a.lesson_id JOIN school.modules m ON m.id=l.module_id JOIN school.courses c ON c.id=m.course_id WHERE l.publication='published' AND c.publication='published' AND EXISTS(SELECT 1 FROM school.entitlements e WHERE e.course_id=c.id AND e.student_id=? AND e.revoked_at IS NULL AND (e.expires_at IS NULL OR e.expires_at>?)) ORDER BY a.due_at,l.position",
				studentId,
				studentId,
				new Date().toISOString(),
			);
			result.submissions = service
				.submissions(user, studentId)
				.map((s) => service.submission(user, s.id, studentId));
			result.events = service.db.all(
				'SELECT * FROM school.events WHERE student_id=? OR EXISTS(SELECT 1 FROM school.group_members gm WHERE gm.group_id=school.events.group_id AND gm.student_id=?) ORDER BY starts_at',
				studentId,
				studentId,
			);
			if (parts[1] === 'courses' && parts[2])
				result.course = service.course(parts[2], user, studentId);
			if (parts[1] === 'lessons' && parts[2]) {
				result.lesson = service.lesson(parts[2], user, studentId);
				result.course = service.course(result.lesson.course_id, user, studentId);
				result.attempts = service.db.all(
					'SELECT exercise_id,score,feedback,created_at FROM school.attempts WHERE student_id=? AND lesson_id=? ORDER BY created_at DESC',
					studentId,
					parts[2],
				);
			}
			if (parts[1] === 'homework' && parts[2])
				result.submission = service.submission(user, parts[2], studentId);
			if (parts[1] === 'materials')
				result.catalog = service.materials(user, { ...result.query, studentId });
			if (parts[1] === 'profile') result.profile = user;
		} else if (staff && user) {
			result.students = service.students(user);
			result.groupMembers=service.db.all('SELECT gm.* FROM school.group_members gm JOIN school.groups g ON g.id=gm.group_id '+(user.role==='admin'?'':'WHERE g.teacher_id=?'),...(user.role==='admin'?[]:[user.id]));
			result.courses = service.db.all(
				'SELECT * FROM school.courses ' +
					(user.role === 'admin' ? '' : 'WHERE owner_id=?') +
					' ORDER BY title',
				...(user.role === 'admin' ? [] : [user.id]),
			);
			result.submissions = service.submissions(user);
			result.events = service.db.all(
				'SELECT * FROM school.events ' +
					(user.role === 'admin' ? '' : 'WHERE teacher_id=?') +
					' ORDER BY starts_at',
				...(user.role === 'admin' ? [] : [user.id]),
			);
			result.activities = service.db.all(
				'SELECT a.*,u.name FROM school.audit a JOIN pd.users u ON u.id=a.actor_id ' +
					(user.role === 'admin' ? '' : 'WHERE actor_id=?') +
					' ORDER BY created_at DESC LIMIT 12',
				...(user.role === 'admin' ? [] : [user.id]),
			);
			result.groups = service.db.all(
				'SELECT * FROM school.groups ' + (user.role === 'admin' ? '' : 'WHERE teacher_id=?'),
				...(user.role === 'admin' ? [] : [user.id]),
			);
			if (parts[1] === 'students' && parts[2]) {
				if (!service.canManage(user, parts[2])) throw new SchoolError(404, 'Ученик не найден.');
				result.student = result.students.find((s: Row) => s.id === parts[2]);
				result.note =
					service.db.one('SELECT text FROM pd.notes WHERE student_id=?', parts[2])?.text ?? '';
				result.entitlements = service.db.all(
					'SELECT e.*,c.title FROM school.entitlements e JOIN school.courses c ON c.id=e.course_id WHERE student_id=?',
					parts[2],
				);
				result.submissions = result.submissions.filter((s: Row) => s.student_id === parts[2]);
				result.writtenAttempts = service.db.all(
					'SELECT a.id,a.created_at,l.title,r.text FROM school.attempts a JOIN pd.responses r ON r.id=a.id JOIN school.lessons l ON l.id=a.lesson_id WHERE a.student_id=?',
					parts[2],
				);
			}
			if (parts[1] === 'groups' && parts[2]) {
				const group = result.groups.find((g: Row) => g.id === parts[2]);
				if (!group) throw new SchoolError(404, 'Группа не найдена.');
				result.group = {
					...group,
					members: service.db.all(
						'SELECT u.id,u.name FROM pd.users u JOIN school.group_members gm ON gm.student_id=u.id WHERE gm.group_id=?',
						group.id,
					),
				};
			}
			if (parts[1] === 'courses' && parts[2] && parts[2] !== 'new')
				result.course = service.course(parts[2], user, undefined, true);
			if (parts[1] === 'lessons' && parts[2]) {
				result.lesson = service.lesson(parts[2], user, undefined, true);
				result.course = service.course(result.lesson.course_id, user, undefined, true);
				result.materialIds = service.db
					.all('SELECT material_id FROM school.lesson_materials WHERE lesson_id=?', parts[2])
					.map((m) => m.material_id)
					.join(', ');
			}
			if (parts[1] === 'review' && parts[2]) result.submission = service.submission(user, parts[2]);
			if (parts[1] === 'library') {
				if (parts[2] === 'import') service.require(user, ['admin']);
				result.catalog = service.materials(user, result.query);
				if (parts[2] && parts[2] !== 'import') {
					result.material = service.db.one('SELECT * FROM school.materials WHERE id=?', parts[2]);
					if (!result.material) throw new SchoolError(404, 'Материал не найден.');
				}
				result.importRuns = service.db.all(
					'SELECT * FROM school.import_runs ORDER BY created_at DESC LIMIT 20',
				);
			}
			if (parts[1] === 'leads' || parts.length === 1)
				result.leads = service.db.all(
					'SELECT f.*,p.name,p.contact,p.notes FROM lead_funnel f JOIN pd.leads p ON p.id=f.id ' +
						(user.role === 'admin' ? '' : 'WHERE f.assigned_teacher_id=?') +
						' ORDER BY f.created_at DESC',
					...(user.role === 'admin' ? [] : [user.id]),
				);
			if (parts[1] === 'leads' && user.role === 'admin')
				result.teachers = service.db.all(
					"SELECT id,name FROM pd.users WHERE role='teacher' AND active=1",
				);
			if (parts[1] === 'settings') {
				service.require(user, ['admin']);
				result.users = service.db.all('SELECT id,name,role FROM pd.users ORDER BY role,name');
			}
		} else {
			result.courses = service.publicCourses(searchParams.get('q') ?? '');
			for (const key of ['level', 'topic', 'audience', 'format'])
				if (searchParams.get(key))
					result.courses = result.courses.filter(
						(c: Row) => c[key] === searchParams.get(key),
					);
			if (parts[0] === 'directions' && parts[1]) result.course = service.course(parts[1]);
			if (parts[0] === 'demo') {
				result.lesson = service.lesson(parts[1] ?? 'hola', null, undefined, false, true);
				result.course = service.course('demo-a1');
			}
			if (parts[0] === 'free-materials') {
				result.catalog = service.materials(null, { ...result.query, publicOnly: true });
				if (parts[1]) {
					if (!service.materialAccess(null, parts[1]))
						throw new SchoolError(404, 'Материал не найден.');
					result.material = service.db.one(
						'SELECT id,title,description,instructions,format,missing FROM school.materials WHERE id=?',
						parts[1],
					);
				}
			}
			if (parts[0] === 'login')
				result.demoUsers = service.development
					? service.db.all('SELECT id,name,role FROM pd.users WHERE active=1 ORDER BY role,name')
					: [];
		}
		return { school: result };
}
