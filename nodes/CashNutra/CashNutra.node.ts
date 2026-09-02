import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

const API_BASE = 'https://www.cash-nutra.com/api/partner-offer-api/v1';
const MAX_PAGE_SIZE = 250;

type CashNutraResponse = {
	data?: IDataObject[];
	meta?: {
		has_more?: boolean;
		next_cursor?: string | null;
	};
};

const requestPage = async (
	context: IExecuteFunctions,
	path: string,
	qs: IDataObject,
): Promise<CashNutraResponse> => {
	const options: IHttpRequestOptions = {
		method: 'GET',
		url: `${API_BASE}${path}`,
		qs,
		json: true,
	};
	return (await context.helpers.httpRequestWithAuthentication.call(
		context,
		'cashNutraApi',
		options,
	)) as CashNutraResponse;
};

const collectPages = async (
	context: IExecuteFunctions,
	path: string,
	baseQuery: IDataObject,
	returnAll: boolean,
	limit: number,
): Promise<IDataObject[]> => {
	const output: IDataObject[] = [];
	let cursor: string | undefined;

	do {
		const remaining = returnAll ? MAX_PAGE_SIZE : Math.max(limit - output.length, 1);
		const response = await requestPage(context, path, {
			...baseQuery,
			page_size: Math.min(remaining, MAX_PAGE_SIZE),
			...(cursor ? { cursor } : {}),
		});
		const data = Array.isArray(response.data) ? response.data : [];
		output.push(...data);
		cursor = response.meta?.has_more ? (response.meta.next_cursor ?? undefined) : undefined;
	} while (cursor && (returnAll || output.length < limit));

	return returnAll ? output : output.slice(0, limit);
};

export class CashNutra implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cash Nutra',
		name: 'cashNutra',
		icon: { light: 'file:cashnutra.svg', dark: 'file:cashnutra.dark.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Read approved Cash Nutra offers and affiliate-scoped conversions',
		defaults: { name: 'Cash Nutra' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Offer', value: 'offer' },
					{ name: 'Conversion', value: 'conversion' },
				],
				default: 'offer',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [{ name: 'Get Many', value: 'getMany', action: 'Get many records' }],
				default: 'getMany',
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 1000 },
				default: 50,
				description: 'Max number of results to return',
				displayOptions: { show: { returnAll: [false] } },
			},
			{
				displayName: 'Include Tracking URLs',
				name: 'includeTrackingUrls',
				type: 'boolean',
				default: false,
				description:
					'Whether to issue opaque affiliate tracking links. Disabled by default so discovery remains in dry-run mode.',
				displayOptions: { show: { resource: ['offer'] } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Available', value: 'available' },
					{ name: 'Approved', value: 'approved' },
					{ name: 'Requires Approval', value: 'requires_approval' },
				],
				default: 'available',
				displayOptions: { show: { resource: ['offer'] } },
			},
			{
				displayName: 'Updated Since',
				name: 'updatedSince',
				type: 'dateTime',
				default: '',
				description:
					'Optional ISO-8601 watermark. Conversions default to the last 24 hours when left empty.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const results: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
			const resource = this.getNodeParameter('resource', itemIndex) as string;
			const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
			const limit = returnAll
				? MAX_PAGE_SIZE
				: (this.getNodeParameter('limit', itemIndex) as number);
			const updatedSince = this.getNodeParameter('updatedSince', itemIndex, '') as string;
			let data: IDataObject[];

			if (resource === 'offer') {
				const includeTrackingUrls = this.getNodeParameter(
					'includeTrackingUrls',
					itemIndex,
				) as boolean;
				const status = this.getNodeParameter('status', itemIndex) as string;
				data = await collectPages(
					this,
					'/offers',
					{
						status,
						include_tracking_url: includeTrackingUrls,
						...(includeTrackingUrls ? {} : { dry_run: true }),
						...(updatedSince ? { updated_since: updatedSince } : {}),
					},
					returnAll,
					limit,
				);
			} else {
				const safeWatermark =
					updatedSince || new Date(Date.now() - 86_400_000).toISOString();
				data = await collectPages(
					this,
					'/conversions',
					{ updated_since: safeWatermark },
					returnAll,
					limit,
				);
			}

			results.push(...data.map((json) => ({ json, pairedItem: { item: itemIndex } })));
		}

		return [results];
	}
}
