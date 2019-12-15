import classNames from 'classnames';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconName } from '@blueprintjs/icons';

interface NavLinkProps {
  className?: string;
  children: React.ReactChild[] | React.ReactChild;
  exact?: boolean;
  icon?: IconName;
  to: string;
}

export default function NavLink({
  className,
  exact,
  to,
  icon,
  children,
}: NavLinkProps): JSX.Element {
  const location = useLocation();

  return (
    <Link
      className={classNames(className, 'bp3-button', icon ? `bp3-icon-${icon}` : '', 'bp3-minimal', {
        'bp3-active': location.pathname === to || (!exact && location.pathname.startsWith(`${to}/`)),
      })}
      to={to}
    >
      {children}
    </Link>
  );
}
