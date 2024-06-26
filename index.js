import { addRow, deleteRow } from "./view.js";
import { form } from "./ds.js";

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

window.addRow = addRow;
window.deleteRow = deleteRow;
// window.toggleDarkMode = toggleDarkMode;