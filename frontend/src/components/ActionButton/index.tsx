import { Button, type ButtonPropsColorOverrides } from '@mui/material'
import type { OverridableStringUnion } from '@mui/types';
import React from 'react'

  export type ButtonColor = OverridableStringUnion<
  'primary' | 'secondary' | 'success' | 'warning' | 'inherit' | 'error' | 'info',
  ButtonPropsColorOverrides
  >;

  export interface ButtonAction {
    label: string;
    icon: React.ReactNode;
    color: ButtonColor;
    action: () => void;
}
  
const ActionButton = (props: any) => {
  const { actions } = props;



  return (
    <Button
      variant="contained"
      color={actions.color}
      fullWidth
      onClick={actions.action}
      startIcon={actions.icon}
    >
      {actions.label}
    </Button>
  );
};

export default ActionButton