'use strict';

module.exports = app => {
  require('./router/mp')(app);
  require('./router/admin')(app);
};
