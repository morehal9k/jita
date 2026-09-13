import React from 'react';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const cjsReact = require('react');

const internals =
  cjsReact.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
  (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
  {};

if (!internals.ReactCurrentOwner) internals.ReactCurrentOwner = { current: null };
if (!internals.ReactCurrentActQueue) internals.ReactCurrentActQueue = { current: null };
if (!internals.ReactCurrentDispatcher) internals.ReactCurrentDispatcher = { current: null };

cjsReact.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = internals;
cjsReact.__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = internals;
(React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = internals;
(React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = internals;
