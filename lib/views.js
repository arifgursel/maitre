var sys = require('sys');

exports.MembershipsView = function(memberships, work_sessions) {
  var checked_in_ids = work_sessions.map(function(work_session) {
    return work_session['membership_id'];
  });
  return memberships.map(function(membership) {
    return({
      name: membership.address.name || membership.address.company,
      plan: membership.plan.name,
      payment_method: membership.payment_method.name,
      id: membership.id,
      checked_in: checked_in_ids.indexOf(membership.id) != -1
    });
  });
};