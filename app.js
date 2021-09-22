// Classe que representa um cenário
class Cenario {
    constructor(id = null, probabilidade = 0.0, melhor_oportunidade = Number.MIN_SAFE_INTEGER) {
        this.id = id
        this.probabilidade = probabilidade
        this.melhor_oportunidade = melhor_oportunidade
    }

    // Fabrica multiplos cenários a partir de um array de numeros
    static factory(cenarios = Array()) {
        let result = Array()
        cenarios.forEach((item, key) => {
            result.push(new this(key, item))
        })
        return result
    }
}

// Classe que representa um investimento
class Investimento {
    constructor(
        id = null, 
        valores = Array(), 
        resultado = 0, 
        maxiMax = Number.MIN_SAFE_INTEGER, 
        maxiMin = Number.MIN_SAFE_INTEGER,
        laplace = Number.MIN_SAFE_INTEGER,
        hurwitz = Number.MIN_SAFE_INTEGER 
    ) {
        this.id = id
        this.valores = Array.from(valores)
        this.resultado = resultado,
        this.maxiMax = maxiMax
        this.maxiMin = maxiMin
        this.laplace = laplace
        this.hurwitz = hurwitz
    }
}

function calcRisco(cenarios, investimentos) {
    cenarios = Cenario.factory(cenarios)
    console.log(cenarios)

    let VME = {
        investimento: null,
        resultados: Array()
    }
    let POE = {
        investimento: null,
        melhor_oportunidade: Array(cenarios.length).fill(Number.MIN_SAFE_INTEGER, 0),
        resultados: Array()
    }
    let VEIP = {
        investimento: null,
        resultados: Array()
    }

    // #region VME
    // Calculando o VME
    investimentos.forEach((inv, key) => {
        let aux = new Investimento(key, inv.valores)

        for (let i = 0; i < cenarios.length && i < inv.valores.length; i++) {
            aux.valores[i] *= cenarios[i].probabilidade
            aux.resultado += aux.valores[i]
        }

        VME.resultados.push(aux)
        if (aux.resultado >= (VME.investimento ? VME.investimento.resultado :  Number.MIN_SAFE_INTEGER)) {
            VME.investimento = aux
        }
    })
    // #endregion

    // #region POE
    // Calculando melhor oportunidade do POE
    for(let i = 0; i < cenarios.length; i++) {
        investimentos.forEach(inv => {
            if(i < inv.valores.length)
                POE.melhor_oportunidade[i] = Math.max(POE.melhor_oportunidade[i], inv.valores[i])
        })
        cenarios[i].melhor_oportunidade = POE.melhor_oportunidade[i]
    }
    
    // Calculando o custo de oportunidade e o POE
    investimentos.forEach((inv, key) => {
        let aux = new Investimento(key, inv.valores)

        for (let i = 0; i < cenarios.length && i < inv.valores.length; i++) {
            aux.valores[i] = (inv.valores[i] - cenarios[i].melhor_oportunidade) * -1
            aux.resultado += aux.valores[i] * cenarios[i].probabilidade
        }

        POE.resultados.push(aux)
        if (aux.resultado <= (POE.investimento ? POE.investimento.resultado : Number.MAX_SAFE_INTEGER )) {
            POE.investimento = aux
        }
    })
    // #endregion

    // #region VEIP
    // Calculando o VEIP aproveitando as melhores oportunidades encontradas no POE
    let aux = new Investimento(0, POE.melhor_oportunidade)
    cenarios.forEach(cen => {
        aux.valores[cen.id] *= cen.probabilidade
        aux.resultado += aux.valores[cen.id]
    })
    VEIP.investimento = aux
    VEIP.resultados = VME.resultados
    // #endregion
    
    return {
        VME: VME,
        POE: POE,
        VEIP: VEIP
    }
}

function calcIncerteza(cenarios, investimentos) {
    cenarios = Cenario.factory(cenarios)
    let result = {
        MaxiMax: new Investimento(),
        MaxiMin: new Investimento(),
        Laplace: new Investimento(),
        Hurwitz: new Investimento(),
        resultados: Array()
    }
    
    investimentos.forEach((inv, key) => {
        let aux = new Investimento(key, inv.valores)
        aux.laplace = 0
        aux.maxiMin = Number.MAX_SAFE_INTEGER

        for (let i = 0; i < cenarios.length && i < inv.valores.length; i++) {
            aux.maxiMax = Math.max(aux.maxiMax, inv.valores[i])
            aux.maxiMin = Math.min(aux.maxiMin, inv.valores[i])
            aux.laplace += inv.valores[i]
            
            aux.valores[i] *= cenarios[i].probabilidade
            console.log(cenarios[i].probabilidade)
            aux.resultado += aux.valores[i]
            aux.hurwitz = aux.resultado
        }
        aux.laplace /= inv.valores.length

        result.resultados.push(aux)
        result.MaxiMax = result.MaxiMax.maxiMax < aux.maxiMax ? aux : result.MaxiMax
        result.MaxiMin = result.MaxiMin.maxiMin < aux.maxiMin ? aux : result.MaxiMin
        result.Laplace = result.Laplace.laplace < aux.laplace ? aux : result.Laplace
        result.Hurwitz = result.Hurwitz.hurwitz < aux.hurwitz ? aux : result.Hurwitz
    })

    return result
}