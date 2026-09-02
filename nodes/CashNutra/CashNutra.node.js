'use strict';

const API_BASE = 'https://www.cash-nutra.com/api/partner-offer-api/v1';
const MAX_PAGE_SIZE = 250;

const requestPage = async (context, path, qs) => context.helpers.httpRequestWithAuthentication.call(
  context,
  'cashNutraApi',
  { method: 'GET', url: `${API_BASE}${path}`, qs, json: true },
);

const collectPages = async (context, path, baseQuery, returnAll, limit) => {
  const output = [];
  let cursor;

  do {
    const remaining = returnAll ? MAX_PAGE_SIZE : Math.max(limit - output.length, 1);
    const response = await requestPage(context, path, {
      ...baseQuery,
      page_size: Math.min(remaining, MAX_PAGE_SIZE),
      ...(cursor ? { cursor } : {}),
    });
    const data = Array.isArray(response?.data) ? response.data : [];
    output.push(...data);
    cursor = response?.meta?.has_more ? response?.meta?.next_cursor : undefined;
  } while (cursor && (returnAll || output.length < limit));

  return returnAll ? output : output.slice(0, limit);
};

class CashNutra {
  constructor() {
    this.description = {
      displayName: 'Cash Nutra',
      name: 'cashNutra',
      icon: 'file:cashnutra.svg',
      group: ['transform'],
      version: 1,
      subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
      description: 'Read approved Cash Nutra offers and affiliate-scoped conversions',
      defaults: { name: 'Cash Nutra' },
      inputs: ['main'],
      outputs: ['main'],
      credentials: [{ name: 'cashNutraApi', required: true }],
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
        },
        {
          displayName: 'Limit',
          name: 'limit',
          type: 'number',
          typeOptions: { minValue: 1, maxValue: 1000 },
          default: 100,
          displayOptions: { show: { returnAll: [false] } },
        },
        {
          displayName: 'Include Tracking URLs',
          name: 'includeTrackingUrls',
          type: 'boolean',
          default: false,
          description: 'When disabled, the request uses dry-run mode and does not issue an opaque tracking link',
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
          description: 'Optional ISO-8601 watermark. Conversions default to the last 24 hours when left empty.',
        },
      ],
    };
  }

  async execute() {
    const items = this.getInputData();
    const results = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
      const resource = this.getNodeParameter('resource', itemIndex);
      const returnAll = this.getNodeParameter('returnAll', itemIndex);
      const limit = returnAll ? MAX_PAGE_SIZE : this.getNodeParameter('limit', itemIndex);
      const updatedSince = this.getNodeParameter('updatedSince', itemIndex, '');

      if (resource === 'offer') {
        const includeTrackingUrls = this.getNodeParameter('includeTrackingUrls', itemIndex);
        const status = this.getNodeParameter('status', itemIndex);
        const data = await collectPages(this, '/offers', {
          status,
          include_tracking_url: includeTrackingUrls,
          ...(includeTrackingUrls ? {} : { dry_run: true }),
          ...(updatedSince ? { updated_since: updatedSince } : {}),
        }, returnAll, limit);
        results.push(...data);
      } else {
        const safeWatermark = updatedSince || new Date(Date.now() - 86_400_000).toISOString();
        const data = await collectPages(this, '/conversions', { updated_since: safeWatermark }, returnAll, limit);
        results.push(...data);
      }
    }

    return [this.helpers.returnJsonArray(results)];
  }
}

module.exports = { CashNutra };
