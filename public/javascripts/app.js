$(function() {
  $('form#select_space').submit(function(e) {
    e.preventDefault();
    var subdomain = $('#subdomain').val();
    if(subdomain.length) {
      location.href = '/spaces/' + subdomain;
    };
  });
  
  $('#memberships .check_in').click(function(e) {
    e.preventDefault();
    var link = this,
      url = '/' + window.space_subdomain + '/' + $(this).attr('data-membership-id') + '/check_ins';
    $(link).text('...');
    
    
    $.post(url,  function() {
      $(link).replaceWith('already checked in');
    });
  });
});