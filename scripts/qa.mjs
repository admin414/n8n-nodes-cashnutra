import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { CashNutraApi } = require('../dist/credentials/CashNutraApi.credentials.js');
const { CashNutra } = require('../dist/nodes/CashNutra/CashNutra.node.js');

const credential = new CashNutraApi();
assert.equal(credential.properties[0].typeOptions.password, true);
assert.equal(credential.test.request.qs.include_tracking_url, false);
assert.equal(credential.test.request.qs.dry_run, true);

const requests = [];
const parameters = {
	resource: 'offer',
	returnAll: true,
	updatedSince: '',
	includeTrackingUrls: false,
	status: 'available',
};
const context = {
	getInputData: () => [{}],
	getNodeParameter: (name, _itemIndex, fallback) => parameters[name] ?? fallback,
	helpers: {
		httpRequestWithAuthentication: async (_credentialName, request) => {
			requests.push(request);
			return requests.length === 1
				? { data: [{ id: 'offer-2' }], meta: { has_more: true, next_cursor: 'cursor-2' } }
				: { data: [{ id: 'offer-1' }], meta: { has_more: false, next_cursor: null } };
		},
	},
};

const result = await CashNutra.prototype.execute.call(context);
assert.deepEqual(result, [
	[
		{ json: { id: 'offer-2' }, pairedItem: { item: 0 } },
		{ json: { id: 'offer-1' }, pairedItem: { item: 0 } },
	],
]);
assert.equal(requests.length, 2);
assert.equal(requests[0].qs.include_tracking_url, false);
assert.equal(requests[0].qs.dry_run, true);
assert.equal(requests[1].qs.cursor, 'cursor-2');

console.log('Cash Nutra n8n runtime contract: OK');
