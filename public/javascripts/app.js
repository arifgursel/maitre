$(function() {
  $('form#select_space').submit(function(e) {
    e.preventDefault();
    var subdomain = $('#subdomain').val()
    if(subdomain.length) {
      location.href = '/spaces/' + subdomain;
    };
  })
});