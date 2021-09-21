$('.nav.nav-tabs a').on('click', (e) => {
    $('.nav.nav-tabs *').removeClass('active')
    e.target.classList.add('active')
    $('.nav.nav-tabs + .tab-content *').removeClass('active')
    $(`.nav.nav-tabs + .tab-content ${$(e.target).attr('togle')}`).addClass('active')
})

function calcRisco(cenarios, investimentos, tipo) {

    switch(tipo) {
        case 0: 
            investimentos.forEach(inv => {
                for(let i = 0; i < cenarios.length && i < inv.val.length; i++) {
                    inv.res += inv.val[i] * cenarios[i]
                }
            })
            break
        case 1:
            let max = Array().fill(0,0,cenarios.length - 1);
            for(let i = 0; i < cenarios.length && i < inv.val.length; i++) {
                investimentos.forEach(inv => {
                    max[i] = (max[i] < inv.val[i]) ? inv.val[i] : max[i]
                })
            }

            investimentos.forEach(inv => {
                for(let i = 0; i < max.length && i < inv.val.length; i++) {
                    inv.val[i] = inv.val[i] - max[i]
                    inv.res += inv.val[i] * cenarios[i]
                }
            })
    }

    return investimentos;
}