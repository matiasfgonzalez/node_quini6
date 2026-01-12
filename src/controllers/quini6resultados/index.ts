import express from 'express';
import * as cheerio from 'cheerio';
import * as _ from 'lodash';
import { Sorteo } from '../../interfaces/Sorteo';
import { ResultadoSorteo } from '../../interfaces/ResultadosSorteo';
import { Numero, TodosLosNumeros } from '../../interfaces/TodosLosNumeros';

const axios = require('axios').default;
const router = express.Router();

const obtenerListaSorteos = async () : Promise<Sorteo[]> => {
  const url2Get = 'https://www.quini-6-resultados.com.ar/quini6/sorteos-anteriores.aspx';
  try {
    const response = await axios.get(url2Get, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-419,es;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      },
    });
    const $ = cheerio.load(response.data);
    const resp: Sorteo[] = [];
    $('div.col-md-3 p a').each((i, el) => {
      const tit = $(el).text().split('del ');
      resp[i] = {
        numero: tit[0].replace('Sorteo ', ''),
        titulo: tit[0],
        fecha: tit[1].replace(/-/g, '/').trim(),
        link: $(el).attr('href'),
      };
    });
    return resp;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    throw (error);
  }
};

const searchJSON = (obj:any, key:any, val:any) => {
  let results :any = [];
  for (let k in obj) {
    if (obj.hasOwnProperty(k)) {
      if (k === key && obj[k] === val) {
        results.push(obj);
      } else if (typeof obj[k] === 'object') {
        results = results.concat(searchJSON(obj[k], key, val));
      }
    }
  }
  return results;
};

const obtenerResultadoSorteo = async (nroSorteo: number) : Promise<ResultadoSorteo> => {
  const listaSorteos = await obtenerListaSorteos();
  const resBusca = searchJSON(listaSorteos, 'numero', nroSorteo.toString());
  const url2Get = resBusca[0].link;
  // const retorno = {} as ResultadoSorteo;
  const retorno:ResultadoSorteo = {
    infoSorteo: resBusca,
    resultados: [],
  };

  return new Promise(async (resolve, reject) => {

    try {

      const response = await axios.get(url2Get, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'es-419,es;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
        },
      });
      const $ = cheerio.load(response.data);
      
      // 1 SORTEO TRADICIONAL
      retorno.resultados.push({
        titulo: 'SORTEO TRADICIONAL',
        numeros: $('h3:contains("SORTEO TRADICIONAL")').next()
          .text().trim()
          .replace(/-/g, ',')
          .replace(/\s/g, ''),
        premios: [],
      });
      $('tr.verde:contains("SORTEO TRADICIONAL")').nextUntil('tr.verde').each((i, el) => {
        const st = $(el).find('td').toArray();
        retorno.resultados[0].premios.push({
          aciertos: $(st[0]).text().trim(),
          ganadores: $(st[1]).text().trim(),
          premio: $(st[2]).text().trim(),
        });
      });

      // 2 LA SEGUNDA DEL QUINI
      retorno.resultados.push({
        titulo: 'LA SEGUNDA DEL QUINI',
        numeros: $('h3:contains("LA SEGUNDA DEL QUINI")').next()
          .text().trim()
          .replace(/-/g, ',')
          .replace(/\s/g, ''),
        premios: [],
      });
      $('tr.verde:contains("LA SEGUNDA DEL QUINI 6")').first().nextUntil('tr.verde').each((i, el) => {
        const sq = $(el).find('td').toArray();
        retorno.resultados[1].premios.push({
          aciertos: $(sq[0]).text().trim(),
          ganadores: $(sq[1]).text().trim(),
          premio: $(sq[2]).text().trim(),
        });
      });

      // 3 SORTEO REVANCHA
      retorno.resultados.push({
        titulo: 'SORTEO REVANCHA',
        numeros: $('h3:contains("SORTEO REVANCHA")').next()
          .text().trim()
          .replace(/-/g, ',')
          .replace(/\s/g, ''),
        premios: [],
      });
      $('tr.verde:contains("LA SEGUNDA DEL QUINI 6 REVANCHA")').nextUntil('tr.verde').each((i, el) => {
        const sqr = $(el).find('td').toArray();
        retorno.resultados[2].premios.push({
          aciertos: $(sqr[0]).text().trim(),
          ganadores: $(sqr[1]).text().trim(),
          premio: $(sqr[2]).text().trim(),
        });
      });

      // 4 SIEMPRE SALE
      retorno.resultados.push({
        titulo: 'SIEMPRE SALE',
        numeros: $('h3:contains("QUE SIEMPRE SALE")').next()
          .text().trim()
          .replace(/-/g, ',')
          .replace(/\s/g, ''),
        premios: [],
      });
      $('tr.verde:contains("EL QUINI QUE SIEMPRE SALE")').nextUntil('tr.verde').each((i, el) => {
        const qqsl = $(el).find('td').toArray();
        retorno.resultados[3].premios.push({
          aciertos: $(qqsl[0]).text().trim(),
          ganadores: $(qqsl[1]).text().trim(),
          premio: $(qqsl[2]).text().trim(),
        });
      });

      // 5 POZO EXTRA
      retorno.resultados.push({
        titulo: 'POZO EXTRA',
        numeros: 'Se reparte entre los que tengan seis aciertos contando los tres primeros sorteos. Los números repetidos se cuentan solo una vez.',
        premios: [],
      });
      $('tr.verde:contains("QUINI 6 POZO EXTRA")').nextUntil('tr.verde').each((i, el) => {
        const qpe = $(el).find('td').toArray();
        retorno.resultados[4].premios.push({
          aciertos: $(qpe[0]).text().trim(),
          ganadores: $(qpe[1]).text().trim(),
          premio: $(qpe[2]).text().trim(),
        });
      });
      
      resolve(retorno);

    } catch (error) {
      reject(error);
    }
  });
};

const obtenerTodosLosSorteos = async () : Promise<ResultadoSorteo[]> => {
  const listaSorteos = await obtenerListaSorteos();
  listaSorteos.sort((a, b) => {  
    return parseInt(a.numero) <= parseInt(b.numero) ? 1 : -1;
  });
  return Promise.all(listaSorteos.map((item) => {
    return obtenerResultadoSorteo(parseInt(item.numero));
  }));
};

router.get('/', (req, res) => {
  res.json({
    message: 'Sitio: https://www.quini-6-resultados.com.ar/',
  });
});

router.get('/sorteos', async (req, res) => {
  try {
    const datos = await obtenerListaSorteos();
    // Ordena los sorteos por número de sorteo (fecha) en orden descendiente (el ultimo sorteo primero)
    datos.sort((a, b) => {  
      return parseInt(a.numero) <= parseInt(b.numero)
        ? 1
        : -1;
    });
    res.status(200).json({
      message: 'Sorteos obtenidos exitosamente',
      cantidad: datos.length,
      data: datos,
    });
  } catch (error) {
    return res.status(400).json({ message: error });
  }
});

router.get('/sorteo/:sorteoNro', async (req, res) => {
  if (req.params.sorteoNro !== undefined) {
    try {
      const datos = await obtenerResultadoSorteo(parseInt(req.params.sorteoNro));
      return res.status(200).json({ message: 'Resultados del sorteo obtenidos exitosamente', data: datos });
    } catch (error) {
      return res.status(400).json({ message: error });
    }
  } else {
    return res.status(500).json({ status: 500, message: 'Debe enviar el parametro sorteoNro' });
  }  
});

router.get('/todoslosnumeros', async (req, res) => {
  try {
    const datos = await obtenerTodosLosSorteos();

    let datosFinales:TodosLosNumeros = {
      tiposorteo: [],
    };
    
    let numerosTradicional : Numero[] = [];
    let numerosSegunda : Numero[] = [];
    let numerosRevancha : Numero[] = [];
    let numerosSiempreSale : Numero[] = [];
    let numArre:any[] = []; // Para almacenar de cuajo todos los numeros
    for (let dd = 0; dd < datos.length; dd++) {
      let dataSorteo = datos[dd];
      for (let ds = 0; ds < dataSorteo.resultados.length; ds++) {
        if (dataSorteo.resultados[ds].titulo == 'POZO EXTRA') {
        } else {
          switch (dataSorteo.resultados[ds].titulo) { 
            case 'SORTEO TRADICIONAL': { 
              numerosTradicional.push({
                fecha: datos[dd].infoSorteo[0].fecha,
                numero: datos[dd].infoSorteo[0].numero,
                numeros: dataSorteo.resultados[ds].numeros,
              });
              break; 
            } 
            case 'LA SEGUNDA DEL QUINI': { 
              numerosSegunda.push({
                fecha: datos[dd].infoSorteo[0].fecha,
                numero: datos[dd].infoSorteo[0].numero,
                numeros: dataSorteo.resultados[ds].numeros,
              });
              break; 
            } 
            case 'SORTEO REVANCHA': { 
              numerosRevancha.push({
                fecha: datos[dd].infoSorteo[0].fecha,
                numero: datos[dd].infoSorteo[0].numero,
                numeros: dataSorteo.resultados[ds].numeros,
              });
              break; 
            } 
            case 'SIEMPRE SALE': { 
              numerosSiempreSale.push({
                fecha: datos[dd].infoSorteo[0].fecha,
                numero: datos[dd].infoSorteo[0].numero,
                numeros: dataSorteo.resultados[ds].numeros,
              });
              break; 
            } 
            default: { 
              //statements; 
              break; 
            }
          }
          numArre.push(dataSorteo.resultados[ds].numeros);
        }
      }
    }

    // 1 SORTEO TRADICIONAL
    datosFinales.tiposorteo.push({
      titulo: 'SORTEO TRADICIONAL',
      numeros: numerosTradicional,
    });

    // 2 SORTEO LA SEGUNDA
    datosFinales.tiposorteo.push({
      titulo: 'LA SEGUNDA DEL QUINI',
      numeros: numerosSegunda,
    });

    // 3 SORTEO REVANCHA
    datosFinales.tiposorteo.push({
      titulo: 'SORTEO REVANCHA',
      numeros: numerosRevancha,
    });
    
    // 4 SIEMPRE SALE
    datosFinales.tiposorteo.push({
      titulo: 'SIEMPRE SALE',
      numeros: numerosSiempreSale,
    });

    res.status(200).json({
      message: 'Todos los números históricos obtenidos exitosamente',
      data: datosFinales,
      todosLosNumerosEver: numArre,
    });

  } catch (error) {
    return res.status(400).json({ message: error });
  }  
});

router.get('/controlar/:numeros', async (req, res) => {
  if (req.params.numeros !== undefined) {
    try {
      // 1. Parsear numeros del usuario
      const jugada = req.params.numeros.split('-').map(n => parseInt(n));
      if (jugada.length !== 6) {
        return res.status(400).json({ message: 'Debe enviar exactamente 6 números separados por guiones (ej: 01-02-03-04-05-06)' });
      }

      // 2. Obtener ultimo sorteo
      const listaSorteos = await obtenerListaSorteos();
      // Ordenar descendente para tener el mas reciente primero
      listaSorteos.sort((a, b) => parseInt(b.numero) - parseInt(a.numero));
      const ultimoSorteoHeader = listaSorteos[0];
      
      const ultimoSorteo = await obtenerResultadoSorteo(parseInt(ultimoSorteoHeader.numero));

      // 3. Comparar
      const reporte: any = {
        sorteo: {
          numero: ultimoSorteoHeader.numero,
          fecha: ultimoSorteoHeader.fecha,
        },
        jugadaUsuario: jugada,
        resultados: []
      };

      ultimoSorteo.resultados.forEach (juego => {
        // Ignorar Pozo Extra y otros que no sean arrays de numeros
        if(juego.titulo === 'POZO EXTRA') return;
        
        // Convertir string de numeros sorteados a array de ints
        // "01,05,12..." -> [1, 5, 12...]
        const numerosSorteados = juego.numeros
          .split(',')
          .map(n => parseInt(n))
          .filter(n => !isNaN(n));

        if(numerosSorteados.length > 0) {
          const aciertos = _.intersection(jugada, numerosSorteados);
          reporte.resultados.push({
            modalidad: juego.titulo,
            aciertosCantidad: aciertos.length,
            aciertosNumeros: aciertos,
            numerosSorteados: numerosSorteados
          });
        }
      });

      return res.status(200).json({ message: 'Jugada controlada exitosamente', data: reporte });
    } catch (error) {
      return res.status(400).json({ message: error });
    }
  } else {
    return res.status(500).json({ status: 500, message: 'Debe enviar el parametro numeros' });
  }  
});

export default router;
