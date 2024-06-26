'use strict';
import { rotate, addRow } from "./view.js";
import { Survey, smooth, degrees } from "./wellpath.min.js"

export const form = document.forms.ds;

const {min, max, ceil, PI} = Math;
const well3D = document.getElementById('well3D');
const run = (t) => {
    const dt = t - (run.t0 ?? t);
    run.t0 = t;
    rotate(well3D, .00003 * dt * PI);
    run.requestId = requestAnimationFrame(run);
}
const zoom = k => {
    const {x = 1, y = 1, z = 1} = well3D?.layout?.scene?.aspectratio ?? {};
    Plotly.relayout(well3D, 'scene.aspectratio', {x: x * k, y: y * k, z: z * k});
}
const toggleAnimation = () => {
    if (run.requestId) {
        cancelAnimationFrame(run.requestId);
        run.requestId = undefined;
        run.t0 = undefined;
    } else {
        run.requestId = requestAnimationFrame(run);
    }
}

const num = ceil(form.offsetHeight / form.MD[1].offsetHeight);
Array(num).fill(0).forEach((_, i) => addRow(form.MD[1], 'afterend'));

const paste = (event) => {
    event.preventDefault();
    event.target.blur();

    const text = event.clipboardData.getData('text');
    const data = text.split('\n').filter(r => !!r).map(r => r.split('\t').map(v => +v.replace(',', '.')));
    // console.log(JSON.stringify(data))
    const rowElement = event.target.closest('[class*=row]')
    const ind = +rowElement.querySelector("[name='index']").value - 1;
    render(data, ind);
}
const stepwise = (a, pop = true) => {
    const arr = [];
    a.forEach(v => arr.push(v, v));
    if (pop) arr.pop();
    else arr.shift();
    return arr;
}
const root = document.documentElement;
const secondary = getComputedStyle(root).getPropertyValue('--bs-light-bg-subtle');
const surveyChart = (survey) => {
    survey = survey.filter(d => !isNaN(d.MD));
    survey = smooth(survey);
    const isDark = root.dataset.bsTheme === 'dark';
    const color = isDark ? '#bbb' : '#444';

    const x = survey.map(d => d.EW);
    const y = survey.map(d => d.NS);
    const z = survey.map(d => d.TVD);

    const xmin = min(...x);
    const ymin = min(...y);
    const delta_z = max(...z) - min(...z);

    const xrange = [xmin, max(...x, xmin + delta_z)];
    const yrange = [ymin, max(...y, ymin + delta_z)];
    const DLS = stepwise(survey.map(d => degrees(d.DLS) * 100), false);
    const text = stepwise(survey.map(d => d.MD.toFixed(0)))
        .map((MD, i, a) => i % 2 ? '' : `MD: ${a[i - 1]}-${MD}<br>DLS: ${DLS[i].toFixed(3)}`);

    const chart_data = [{
        name: '', mode: 'lines', type: 'scatter3d', showlegend: false,
        x: stepwise(x), y: stepwise(y), z: stepwise(z),
        line: {
            width: 5,
            color: DLS, showscale: true, cmax: 6, cmin: 0,
            colorscale: [[0, 'green'], [.33, 'yellow'], [1, 'red']],
            colorbar: {
                outlinewidth: isDark ? 0 : 1,
                title: {text: 'DLS, °/100ft', side: 'right'},
                thickness: 16, 
                yanchor: 'top', y: 1, ypad: 0,
                xanchor: 'left', x: 0, xpad: 9,
                orientation: 'h', len: 0.92,
            }
        },
        text, hoverinfo: 'text',
    }];
    const spike = {spikethickness: 1, spikecolor: 'RoyalBlue', showspikes: true, spikesides: false};
    const axis = {mirror: true, zeroline: false, showline: true, hoverformat: '.2f', color, ...spike};
    const config = {
        responsive: true, displaylogo: false,
        modeBarButtonsToRemove: ['resetCameraLastSave3d', 'zoom3d'],
    };
    const play = ' &#9654;';
    const pause = '&#10074;&#10074;';
    const updatemenus = [{
        buttons: [{
            args: [], name: '-', label: '&#10134;', method: 'relayout',
        }, {
            args: [], name: '+', label: '&#10133;', method: 'relayout',
        }, {
            args2: [{'updatemenus[0].buttons[2].label': pause, 'updatemenus.y': '0'}],
            args: [{'updatemenus[0].buttons[2].label': play}],
            label: run.requestId ? pause : play,
            method: 'relayout', name: 'animate'
        }],
        pad: {b: 3, r: 6},
        bgcolor: isDark ? secondary : '#fff',
        borderwidth: 2, bordercolor: isDark ? '#212529' : '#fff',
        type: 'buttons', showactive: false, direction: 'up',
        x: 1, xanchor: 'right', y: 0, yanchor: 'bottom',
    }]
    const layout = {
        margin: {l: 0, r: 0, b: 0, t: 3},
        paper_bgcolor: isDark ? '#212529' : '#fff',
        autosize: true,
        font: {size: 12, family: "Arial", color},
        updatemenus,
        modebar: {orientation: 'v'},
        scene: {
            aspectratio: {x: 1, y: 1, z: 1},
            xaxis: {
                title: 'EW, ft', ...axis, range: xrange,
            },
            yaxis: {
                title: 'NS, ft', ...axis, range: yrange,
            },
            zaxis: {
                title: 'TVD, ft', ...axis,
                autorange: 'reversed', minallowed: 0,
            },
            camera: {
                projection: {type: 'orthographic'},
            },
        }
    };
    Plotly.react(well3D, chart_data, layout, config);
}
const render = (data = [[0, NaN, NaN]], ind = 0) => {
    const survey = Survey(data);
    survey.forEach(({MD, Incl, Azim, DLS, NS, EW, TVD}, i) => {
        const j = i + ind;
        if (!form.MD[j]) {
            addRow(form.MD[j - 1]);
        }
        form.MD[j].value = MD;
        form.Incl[j].value = Incl;
        form.Azim[j].value = Azim;
        form.DLS[j].value = (degrees(DLS) * 100).toFixed(3);
        form.TVD[j].value = TVD.toFixed(2);
        form.NS[j].value = NS.toFixed(2);
        form.EW[j].value = EW.toFixed(2);
    })
    surveyChart(survey);
    // run(0);
}
const loadExample =  async () => {
    const res = await fetch('https://dpdl-dapp.github.io/well-path/inclinometry.csv');
    // const res = await fetch('./inclinometry.csv')
    const text = await res.text();
    const data = text.split('\n').map(r => r.split(';').map(v => +v));

    render(data);
}
form.addEventListener('paste', paste);
form.loadExample.addEventListener('click', loadExample);
form.querySelector('input[type="reset"]').addEventListener('click', () => {
    form.querySelectorAll('.row-vir').forEach((row, i) => {
        if (i > 18) row.remove();
    });
    render();
});
form.addEventListener('change', (event) => {
    const data = Array.from(form.MD).map((input, i) => {
        return [input.valueAsNumber, form.Incl[i].valueAsNumber, form.Azim[i].valueAsNumber];
    });
    render(data);
});
render();
loadExample();
run(0);
well3D.on('plotly_buttonclicked', (e) => {
    const {name} = e.button;
    if (name === 'animate') toggleAnimation();
    else if (name === '+') zoom(1.1);
    else if (name === '-') zoom(0.9);
})