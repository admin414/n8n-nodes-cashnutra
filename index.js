'use strict';

module.exports = {
  credentials: [require('./credentials/CashNutraApi.credentials').CashNutraApi],
  nodes: [require('./nodes/CashNutra/CashNutra.node').CashNutra],
};
