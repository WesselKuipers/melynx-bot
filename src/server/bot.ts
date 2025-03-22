import bot from '~/bot';

const botService = {
  initialized: false,
};

const bootHandler = () => {
  if (!botService.initialized) {
    console.log('[pages/api/_bot.ts] => Melynx Bot Init');
    bot.run();
    botService.initialized = true;
  }

  return botService;
};

export default bootHandler;
