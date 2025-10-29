import React, { useEffect } from 'react';
import { useHistory } from '@docusaurus/router';

export default function NotFound() {
  const history = useHistory();
  useEffect(() => {
    history.replace('/');
  }, [history]);
  return null;
}
