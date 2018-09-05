import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import Collections from './Collections'
import { createKeys } from './services/signing'
const { publicKey, privateKey } = createKeys();

ReactDOM.render((
  <div>
    <Collections privateKey={privateKey} />
  </div>
), document.getElementById('app'));

