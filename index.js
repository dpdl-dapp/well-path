const {hypot, atan2, cos, sin} = Math;

const toggleDarkMode = () => {
    const isDark = document.documentElement.dataset.bsTheme !== 'dark';
    document.documentElement.dataset.bsTheme = isDark ? 'dark' : '';
    document.getElementById('sun')?.classList?.toggle('d-none');
    document.getElementById('moon')?.classList?.toggle('d-none');

    const color = isDark ? '#bbb' : '#444';
    Plotly.update('well3D', {
        'line.colorbar.outlinewidth': isDark ? 0 : 1,
    }, {
        'paper_bgcolor': isDark ? '#212529' : '#fff', 
        'font.color': color,
        'scene.xaxis.color': color, 'scene.yaxis.color': color, 'scene.zaxis.color': color
    });
}

export const addRow = (element, position = 'afterend') => {
    const row = element.closest('[class*=row]');
    
    const row_new = row.cloneNode(true);
    row_new.querySelectorAll("input:not([name='index'])").forEach(input => input.value = "");
    row_new.querySelector(".dropdown-menu").classList.remove('show');
    row_new.querySelector("[name='index']").classList.remove('show');
    row.insertAdjacentElement(position, row_new);

    let row_i = position === 'afterend' ? row_new : row;
    do {
        const el = row_i.querySelector("[name='index']");
        el.value = +el.value + 1;
        row_i = row_i.nextElementSibling;
    } while (row_i)
}

const deleteRow = (e) => {
    const row = e.target.closest('[class*=row]');
    let row_i = row.nextElementSibling;
    if (row.parentElement.children.length > 2) row.remove();
    while (row_i) {
        const el = row_i.querySelector('.btn');
        el.value = +el.value - 1;
        row_i = row_i.nextElementSibling;
    }
}
export const rotate = (chartElem, angle = .2) => {
    const {x = 1.25, y = 1.25} = chartElem.layout.scene.camera.eye ?? {};
    const r = hypot(y, x);
    const t = atan2(y, x) + angle;
    Plotly.relayout(chartElem, 'scene.camera.eye', {x: r * cos(t), y: r * sin(t)});
}

window.addRow = addRow;
window.deleteRow = deleteRow;
window.toggleDarkMode = toggleDarkMode;
