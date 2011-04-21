var sys = require('sys'),
  _ = require('underscore')

exports.MembershipsView = function(memberships, work_sessions) {
  var checked_in_ids = work_sessions.map(function(work_session) {
    return work_session['membership_id'];
  });
  return _(memberships).select(not_canceled).map(function(membership) {
    return({
      name: membership.address.name || membership.address.company,
      plan: membership.plan.name,
      payment_method: membership.payment_method.name,
      id: membership.id,
      checked_in: checked_in_ids.indexOf(membership.id) != -1
    });
  });
  
  function not_canceled(membership) {
    return !membership['canceled_to'] || new Date(membership['canceled_to']) > new Date()
  }
};