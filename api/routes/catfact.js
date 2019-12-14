import axios from 'axios';

async function catfact(req, res) {
  const { data } = await axios.get(
    'https://cat-fact.herokuapp.com/facts/random'
  );
  res.send(data);
}

export default router => {
  router.get('/catfact', catfact);
};
