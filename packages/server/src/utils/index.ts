import axios from 'axios';

export async function getCatFact() {
  return (await axios.get<{ fact: string }>('https://catfact.ninja/fact')).data;
}
