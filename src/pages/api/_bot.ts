import type { NextApiRequest, NextApiResponse } from 'next';
import botHandler from '~/server/bot';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const botServices = botHandler();
  res.status(200).json({ botServices });
}
