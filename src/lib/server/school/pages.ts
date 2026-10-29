import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { SchoolError, type Row } from './types.ts';
import { schoolBackend } from './backend.ts';

export async function schoolPage(event: RequestEvent) {
	try {
		return await (await schoolBackend(event)).view();
	} catch (e) {
		if(e instanceof SchoolError&&e.status===401)redirect(303,'/login');
		if (e instanceof SchoolError) error(e.status, e.message);
		throw e;
	}
}

export async function schoolAction(event: RequestEvent) {
	let values:Record<string,string>={};
	try {
		const backend=await schoolBackend(event);
		const form = await event.request.formData(),
			data: Row = Object.fromEntries(form.entries());
		for (const key of ['consent', 'submit', 'notifications'])
			data[key] = data[key] === 'true' || data[key] === 'on';
		const command = String(data.command ?? '');
		values=Object.fromEntries(['text','name','contact'].filter(key=>typeof data[key]==='string').map(key=>[key,String(data[key]).slice(0,12000)]));
		if (command === 'login') {
			const {token,user:viewer}=await backend.login(data);
			event.cookies.set('school_session', token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: event.url.protocol === 'https:',
				maxAge: 86400,
			});
			redirect(303, ['admin', 'teacher'].includes(viewer.role) ? '/staff' : '/account');
		}
		if (command === 'logout') {
			await backend.logout();
			event.cookies.delete('school_session', { path: '/' });
			redirect(303, '/');
		}
		if (command === 'enquire') {
			await backend.enquiry(data);
			return {
				success:
					'Заявка сохранена. Она появилась в рабочем кабинете школы. Письмо не отправлялось.',
			};
		}
		if (command === 'previewImport' || command === 'applyImport') {
			const csv=data.registry instanceof File?await data.registry.text():String(data.csv??'');
			const output=await backend.importRegistry(csv,String(data.sourceId),command==='applyImport'?String(data.digest):undefined);
			return {
				success:
					command === 'previewImport'
						? 'Предварительный просмотр: данные ещё не записаны.'
						: 'Импорт завершён.',
				importResult: {
					...output,
					records:
						'records' in output
							? output.records.slice(0, 100).map(({ physical, ...r }: Row) => r)
							: undefined,
				},
				csv,
				sourceId: String(data.sourceId),
			};
		}
		const output=await backend.command(command,data,data.file instanceof File&&data.file.size?data.file:undefined);
		if (command === 'course') redirect(303, `/staff/courses/${output.id}/edit`);
		if (command === 'lesson') redirect(303, `/staff/lessons/${output.id}/edit`);
		if (command === 'homework') redirect(303, `/account/homework/${output.id}`);
		if (command === 'enrolLead')
			return {
				success:
					backend.development?'Ученик создан и доступ назначен. Локальная учётная запись доступна на странице тестового входа. Письмо не отправлялось.':'Ученик создан и доступ назначен. Задайте логин и пароль в карточке ученика и передайте их вручную. Письмо не отправлялось.',
			};
		return { success: 'Изменения сохранены.' };
	} catch (e) {
		if (e instanceof SchoolError) return fail(e.status, { message: e.message, values });
		throw e;
	}
}
