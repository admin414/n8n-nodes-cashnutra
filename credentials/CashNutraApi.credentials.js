'use strict';

class CashNutraApi {
  constructor() {
    this.name = 'cashNutraApi';
    this.displayName = 'Cash Nutra API';
    this.documentationUrl = 'https://www.cash-nutra.com/docs/affiliate-api';
    this.properties = [
      {
        displayName: 'API Token',
        name: 'apiToken',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        required: true,
        description: 'Create this token in Cash Nutra Dashboard → Integrations. It is shown once.',
      },
    ];
    this.authenticate = {
      type: 'generic',
      properties: {
        headers: {
          Authorization: '=Bearer {{$credentials.apiToken}}',
        },
      },
    };
    this.test = {
      request: {
        baseURL: 'https://www.cash-nutra.com/api/partner-offer-api/v1',
        url: '/offers',
        qs: { page_size: 1, include_tracking_url: false, dry_run: true },
      },
    };
  }
}

module.exports = { CashNutraApi };
