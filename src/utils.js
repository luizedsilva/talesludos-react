export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function errorMessage(err) {
  return err && err.message ? err.message : String(err)
}
