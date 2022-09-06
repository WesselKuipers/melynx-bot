/* This example requires Tailwind CSS v2.0+ */
import { Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { FaBars, FaChevronDown, FaHome } from 'react-icons/fa';
import { VscClose } from 'react-icons/vsc';
import { BiSticker } from 'react-icons/bi';
import Image from 'next/image';
import Link from 'next/link';

const solutions = [
  {
    name: 'Home',
    description: 'The home page for Melynx Bot.',
    href: '/',
    icon: FaHome,
  },
  {
    name: 'Stickers',
    description: 'View all the stickers available to use in Melynx Bot.',
    href: '/stickers',
    icon: BiSticker,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Example() {
  return (
    <Popover className="relative bg-white dark:bg-gray-700">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between border-b-2 border-gray-100 dark:border-gray-900 py-6 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link href="/">
              <a>
                <span className="sr-only">Melynx Bot</span>
                {/* eslint-disable-next-line @next/next/no-img-element*/}
                <img className="h-8 w-auto sm:h-10" src="/images/logo.png" alt="Logo" />
              </a>
            </Link>
          </div>
          <Link href="/">
            <a className="text-gray-500 dark:text-gray-100 hover:dark:text-gray-300 hover:text-gray-900 font-medium text-base">
              Home
            </a>
          </Link>
          <Link href="/stickers">
            <a className="dark:text-gray-100 hover:dark:text-gray-300 text-gray-500 hover:text-gray-900 font-medium text-base">
              Stickers
            </a>
          </Link>
          <div className="-my-2 -mr-2 md:hidden">
            <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white dark:bg-gray-700 p-2 dark:hover:bg-gray-900 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
              <span className="sr-only">Open menu</span>
              <FaBars className="h-6 w-6" aria-hidden="true" />
            </Popover.Button>
          </div>
          <div className="hidden items-center justify-end md:flex md:flex-1 lg:w-0">
            <Link href="#" passHref>
              <a className="ml-8 inline-flex items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700">
                Sign in
              </a>
            </Link>
          </div>
        </div>
      </div>

      <Transition
        as={Fragment}
        enter="duration-200 ease-out"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="duration-100 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Popover.Panel
          focus
          className="absolute inset-x-0 top-0 origin-top-right transform p-2 transition md:hidden"
        >
          <div className="divide-y-2 divide-gray-50 rounded-lg bg-white dark:bg-gray-700 dark:divide-gray-600 shadow-lg ring-1 ring-black dark:ring-blue-700 ring-opacity-5">
            <div className="px-5 pt-5 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element*/}
                  <>
                    <span className="sr-only">Melynx Bot</span>
                    {/* eslint-disable-next-line @next/next/no-img-element*/}
                    <img className="h-8 w-auto sm:h-10" src="/images/logo.png" alt="Logo" />
                  </>
                </div>
                <div className="-mr-2">
                  <Popover.Button className="inline-flex items-center justify-center rounded-md dark:bg-gray-700 bg-white p-2 dark:text-gray-100 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                    <span className="sr-only">Close menu</span>
                    <VscClose className="h-6 w-6" aria-hidden="true" />
                  </Popover.Button>
                </div>
              </div>
              <div className="mt-6">
                <nav className="grid gap-y-8">
                  {solutions.map((item) => (
                    <Link href={item.href} key={item.name} passHref>
                      <a className="-m-3 flex items-center rounded-md p-3 dark:hover:bg-gray-800 hover:bg-gray-50">
                        <item.icon
                          className="h-6 w-6 flex-shrink-0 dark:text-indigo-300 text-indigo-600"
                          aria-hidden="true"
                        />
                        <span className="ml-3 text-base font-medium dark:text-gray-100 text-gray-900">
                          {item.name}
                        </span>
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
            <div className="space-y-6 py-6 px-5">
              <div>
                <p className="mt-6 text-center text-base font-medium dark:text-gray-100 text-gray-500">
                  Existing user?{' '}
                  <a
                    href="#"
                    className="dark:text-indigo-300 text-indigo-600 hover:text-indigo-500"
                  >
                    Sign in using Discord
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}
