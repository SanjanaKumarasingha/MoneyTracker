import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

type Props = {};

const ErrorPage = (props: Props) => {
  const error = useRouteError();
  console.error(error);

  const isResponseError = isRouteErrorResponse(error);

  const status = isResponseError ? error.status : undefined;

  const message = isResponseError
    ? error.statusText || error.data?.message
    : error instanceof Error
    ? error.message
    : 'Sorry, an unexpected error has occurred.';

  return (
    <div
      id="error-page"
      className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4"
    >
      {status !== undefined && (
        <p className="text-6xl font-bold text-primary-500">{status}</p>
      )}
      <h1 className="text-3xl font-semibold">Oops!</h1>
      <p className="text-zinc-500 dark:text-zinc-400">
        Sorry, an unexpected error has occurred.
      </p>
      {message && (
        <p className="italic text-zinc-600 dark:text-zinc-300">{message}</p>
      )}
      <Link
        to="/"
        className="mt-4 px-4 py-2 rounded-md bg-primary-500 hover:bg-primary-600 text-white transition-colors duration-200"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default ErrorPage;
