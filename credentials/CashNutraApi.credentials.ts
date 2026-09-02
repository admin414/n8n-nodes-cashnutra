import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CashNutraApi implements ICredentialType {
	name = 'cashNutraApi';

	displayName = 'Cash Nutra API';

	documentationUrl =
		'https://github.com/cashnutra/n8n-nodes-cashnutra?tab=readme-ov-file#credentials';

	icon = 'file:cashnutra.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Create this token in Cash Nutra Dashboard → Integrations. It is shown once.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://www.cash-nutra.com/api/partner-offer-api/v1',
			url: '/offers',
			qs: { page_size: 1, include_tracking_url: false, dry_run: true },
		},
	};
}
