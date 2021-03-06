import {FC} from 'react';
import {FormattedMessage} from 'react-intl';

import type {FloodSettings} from '@shared/types/FloodSettings';

import {Form, FormRow} from '../../../ui';
import ModalFormSectionHeader from '../ModalFormSectionHeader';
import MountPointsList from './lists/MountPointsList';

interface DiskUsageTabProps {
  onSettingsChange: (changedSettings: Partial<FloodSettings>) => void;
}

const DiskUsageTab: FC<DiskUsageTabProps> = (props: DiskUsageTabProps) => {
  return (
    <Form>
      <ModalFormSectionHeader>
        <FormattedMessage id="settings.diskusage.mount.points" />
      </ModalFormSectionHeader>
      <FormRow>
        <MountPointsList onSettingsChange={props.onSettingsChange} />
      </FormRow>
    </Form>
  );
};

export default DiskUsageTab;
