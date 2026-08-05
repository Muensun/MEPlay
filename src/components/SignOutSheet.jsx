import { en } from '../i18n/en';
import PillButton from './PillButton';

export default function SignOutSheet({ onConfirm, onCancel }) {
  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <p className="sheet-title">{en.signOutSheet.title}</p>
        <div className="sheet-actions">
          <PillButton variant="logout" onClick={onConfirm}>
            {en.signOutSheet.confirm}
          </PillButton>
          <button className="btn-ghost" onClick={onCancel} type="button">
            {en.signOutSheet.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
