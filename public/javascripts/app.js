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

  if($.jStorage.get('cobot_access_token')) {
    $('a[href=/auth]').attr('href', '/auth?access_token=' + $.jStorage.get('cobot_access_token') + 
     '&access_secret=' + $.jStorage.get('cobot_access_secret')
    );
  }
  
  if(window.access_token) {
    $.jStorage.set('cobot_access_token', window.access_token);
  };
  if(window.access_secret) {
    $.jStorage.set('cobot_access_secret', window.access_secret);
  };
  
  if($('input#subdomain').get(0)) {
    $('input#subdomain').val($.jStorage.get('cobot_subdomain'));
    $('input#subdomain').change(function() {
      $.jStorage.set('cobot_subdomain', $(this).val());
    });
    
  }
  
});