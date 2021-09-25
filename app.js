// Classe que representa um cenário
class Cenario {
    constructor(id = null, probabilidade = 0.0, melhor_oportunidade = Number.MIN_SAFE_INTEGER) {
        this.id = id
        this.probabilidade = probabilidade
        this.melhor_oportunidade = melhor_oportunidade
    }

    /**
     * Método factory qye fabrica um array de cenarios a partir de um
     * array de inteiros com as probabilidades dos cenários
     * @param {Array<int>} cenarios As probabilidades ordenadas dos cenários
     * a ordem influencia qual cenário é (do cenário 0 ao N)
     * @returns {Array<Cenario>} Um array de cenarios
     */
    static factory(cenarios = Array()) {
        let result = Array()
        cenarios.forEach((item, key) => {
            result.push(new this(key, item))
        })
        return result
    }

    /**
     * Transforma este elemento cenário em um elemento html
     * @returns Um elemento formatado com as características do cenário
     */
    toString() {
        return `
        <th id="cenario-input-${this.id}">
          <span class="mr-2">C${this.id}</span>
          <input cen="${this.id}" type="number" min="0" max="100" value="${this.probabilidade * 100}">
          <span class="ml-1">%</span>
        </th>
      `;
    }
}

// Classe que representa um investimento
class Investimento {
    constructor(
        id = null,
        valores = Array(),
        resultado = 0,
        custos_oportunidade = null,
        maxiMax = null,
        maxiMin = null,
        miniMax = null,
        laplace = 0,
        hurwitz = 0
    ) {
        this.id = id
        this.valores = Array.from(valores)
        this.resultado = resultado
        this.custos_oportunidade = custos_oportunidade || Array(this.valores.length)
        this.maxiMax = maxiMax
        this.maxiMin = maxiMin
        this.miniMax = miniMax
        this.laplace = laplace
        this.hurwitz = hurwitz
    }

    /**
     * Método factory que recebe os investimentos em formato de matriz e retorna um array de Investimento
     * @param {Array<Array>} investimentos Os investimentos em forma de matriz, onde 
     * a primeira dimensão é os investimentos e a segunda os valores relativo aos cenarios
     * @returns {Array<Investimento>} Um array de investimentos com os valores passados na matriz
     */
    static factory(investimentos) {
        let result = Array()
        investimentos.forEach((inv, key) => {
            result.push(new this(key, inv))
        })
        return result
    }

    /**
     * Transforma este elemento investimento em um elemento html
     * @returns Um elemento formatado com as características do investimento
     */
    toString(showLabel = false) {
        let html = `<tr inv="${this.id}" id="investimento-input-${this.id}">`
        if(showLabel) {
            html += `<td class="table-label">Inv-${this.id}</td>`
        }
        for (let i = 0; i < this.valores.length; i++) {
            html += `<td class="text-center">
                <input cen="${i}" class="form-control" type="number" min="0" value="${this.valores[i]}">
            </td>`
        }
        return html + '</tr>'
    }
}

function calcRisco(cenarios, investimentos) {

    let VME = {
        investimentos: Array(),
        resultados: Array()
    }
    let POE = {
        investimentos: Array(),
        melhor_oportunidade: Array(cenarios.length).fill(Number.MIN_SAFE_INTEGER, 0),
        resultados: Array()
    }
    let VEIP = {
        investimento: null,
        resultados: Array()
    }

    // Garantir que haja ao menos 1 cenario e investimento válido
    if (cenarios.length < 1 || investimentos.length < 1) {
        return {
            VME: VME,
            POE: POE,
            VEIP: VEIP
        }
    }

    // #region VME
    // Calculando o VME
    let melhor_vme = Number.MIN_SAFE_INTEGER;
    investimentos.forEach((inv, key) => {
        let aux = new Investimento(key, inv.valores)

        for (let i = 0; i < cenarios.length && i < inv.valores.length; i++) {
            aux.valores[i] *= cenarios[i].probabilidade
            aux.resultado += aux.valores[i]
        }

        VME.resultados.push(aux)
        // Procura o melhor resultado para depois buscar todos os que tem valor igual o melhor
        melhor_vme = Math.max(melhor_vme, aux.resultado)
    })

    // Buscando todos os investimentos com o mesmo VME
    VME.resultados.forEach(res => {
        if (res.resultado == melhor_vme)
            VME.investimentos.push(res)
    });
    // #endregion

    // #region POE
    // Calculando melhor oportunidade do POE
    for (let i = 0; i < cenarios.length; i++) {
        investimentos.forEach(inv => {
            if (i < inv.valores.length)
                POE.melhor_oportunidade[i] = Math.max(POE.melhor_oportunidade[i], inv.valores[i])
        })
        cenarios[i].melhor_oportunidade = POE.melhor_oportunidade[i]
    }

    // Calculando o custo de oportunidade e o POE
    let menor_poe = Number.MAX_SAFE_INTEGER
    investimentos.forEach((inv, key) => {
        let aux = new Investimento(key, inv.valores)

        for (let i = 0; i < cenarios.length && i < inv.valores.length; i++) {
            aux.custos_oportunidade[i] = (inv.valores[i] - cenarios[i].melhor_oportunidade) * -1
            aux.resultado += aux.custos_oportunidade[i] * cenarios[i].probabilidade
        }

        POE.resultados.push(aux)
        menor_poe = Math.min(menor_poe, aux.resultado)
    })

    // Buscar todos os investimentos com o melhor resultado
    POE.resultados.forEach(res => {
        if (res.resultado == menor_poe)
            POE.investimentos.push(res);
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

    let result = {
        MaxiMax: Array(),
        MaxiMin: Array(),
        Laplace: Array(),
        Hurwitz: Array(),
        MiniMax: Array(),
        resultados: Array()
    }

    // Garantir que haja ao menos 1 cenario e investimento válido
    if (cenarios.length < 1 || investimentos.length < 1)
        return result

    // Variaveis comparativas para possibilitar resultados com multiplos investimentos
    let melhorMaxiMax = Number.MIN_SAFE_INTEGER;
    let melhorMaxiMin = Number.MAX_SAFE_INTEGER;
    let melhorLaplace = Number.MIN_SAFE_INTEGER;
    let melhorHurwitz = Number.MIN_SAFE_INTEGER;
    let melhorMiniMax = Number.MAX_SAFE_INTEGER;

    // Calculando melhor oportunidade do cenário
    for (let i = 0; i < cenarios.length; i++) {
        investimentos.forEach(inv => {
            if (i < inv.valores.length)
                cenarios[i].melhor_oportunidade = Math.max(cenarios[i].melhor_oportunidade, inv.valores[i])
        })
    }

    // Calculando os melhores resultados
    investimentos.forEach((inv, key) => {
        let aux = new Investimento(key, inv.valores)

        for (let i = 0; i < cenarios.length && i < inv.valores.length; i++) {
            aux.maxiMax = Math.max(aux.maxiMax || Number.MIN_SAFE_INTEGER, inv.valores[i])
            aux.maxiMin = Math.min(aux.maxiMin || Number.MAX_SAFE_INTEGER, inv.valores[i])
            aux.laplace += inv.valores[i]
            aux.hurwitz += aux.valores[i] * cenarios[i].probabilidade

            aux.custos_oportunidade[i] = (inv.valores[i] - cenarios[i].melhor_oportunidade) * -1
            aux.miniMax = Math.max(aux.miniMax || Number.MIN_SAFE_INTEGER, aux.custos_oportunidade[i])
        }
        aux.laplace /= inv.valores.length

        result.resultados.push(aux)
        melhorMaxiMax = Math.max(melhorMaxiMax, aux.maxiMax);
        melhorMaxiMin = Math.min(melhorMaxiMin, aux.maxiMin);
        melhorLaplace = Math.max(melhorLaplace, aux.laplace);
        melhorHurwitz = Math.max(melhorHurwitz, aux.hurwitz);
        melhorMiniMax = Math.min(melhorMiniMax, aux.miniMax);
    })

    // Buscando todos os resultados idênticos aos melhores
    result.resultados.forEach(res => {
        if (melhorMaxiMax == res.maxiMax)
            result.MaxiMax.push(res)
        if (melhorMaxiMin == res.maxiMin)
            result.MaxiMin.push(res)
        if (melhorLaplace == res.laplace)
            result.Laplace.push(res)
        if (melhorHurwitz == res.hurwitz)
            result.Hurwitz.push(res)
        if (melhorMiniMax == res.miniMax)
            result.MiniMax.push(res)
    })

    return result
}