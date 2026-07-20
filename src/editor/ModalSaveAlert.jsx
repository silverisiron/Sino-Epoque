import styles from '../admin/AdminMapEditorPage.module.css'

export function ModalSaveAlert({ visible }) {
  return visible ? (
    <p className={styles.modalSaveAlert} role="status">
      저장되었습니다.
    </p>
  ) : null
}
