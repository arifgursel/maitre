var mustache = require('./mustache').mustache;

exports.version = mustache.version;
exports.render = function(string, options) {
  return mustache.to_html(string, options.locals, options.partials);
}
