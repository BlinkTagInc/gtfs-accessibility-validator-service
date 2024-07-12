'use client';

import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Loading } from './Loading';

interface ValidationResult {
  name: string;
  status: string;
  value: string;
  routes?: Record<string, string>[];
}

const Status = ({ status }: { status: string }) => {
  if (status === 'pass') {
    return <span className="text-green-500">✅︎ Pass</span>;
  }

  if (status === 'fail') {
    return <span className="text-red-500">❌ Fail</span>;
  }

  return null;
};

const UploadForm = () => {
  const [url, setUrl] = useState('');
  const [validationResults, setValidationResults] =
    useState<ValidationResult[]>();
  const [loading, setLoading] = useState(false);

  return (
    <>
      {validationResults ? (
        <>
          <div>
            <h3 className="mb-0">Validation Results</h3>
            <div className="text-sm mb-2">GTFS from {url}</div>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Item</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {validationResults.map((validationResult, index) => {
                  let routeList = null;

                  if (
                    validationResult.routes &&
                    validationResult.routes.length > 0
                  ) {
                    routeList = validationResult.routes.length > 0 && (
                      <span>
                        <br />
                        {validationResult.routes
                          .map(
                            (route) =>
                              route.route_short_name ?? route.route_long_name,
                          )
                          .join(', ')}
                      </span>
                    );
                  }

                  return (
                    <tr key={index}>
                      <td>
                        <Status status={validationResult.status} />
                      </td>
                      <td className="leading-4">
                        {validationResult.name}
                        {routeList}
                        <br />
                        <a href={`#issue-${index}`} className="text-xs">
                          Details
                        </a>
                      </td>
                      <td>{validationResult.value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => setValidationResults(undefined)}
            className="mt-3"
          >
            Validate another GTFS URL
          </button>
        </>
      ) : (
        <>
          <h2>Validate GTFS accessibility</h2>
          {loading ? (
            <Loading url={url} />
          ) : (
            <form
              className="flex flex-row gap-3 items-start"
              onSubmit={async (event) => {
                event.preventDefault();

                if (!url) {
                  toast('Please enter a URL', { type: 'error' });
                  return;
                }

                setLoading(true);

                try {
                  const response = await fetch('/api/validate', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url }),
                  });

                  if (response.ok === false) {
                    const data = await response.json();
                    toast(data.error ?? 'Error validating GTFS', {
                      type: 'error',
                    });
                    setLoading(false);
                    return;
                  }

                  const data = await response.json();

                  if (data.success === false) {
                    toast(data.error, { type: 'error' });
                    setLoading(false);
                    return;
                  }

                  setValidationResults(data.results);
                  setLoading(false);
                } catch (error) {
                  console.error('Error:', error);
                  toast('Error validating GTFS', { type: 'error' });
                  setLoading(false);
                }
              }}
            >
              <label className="sr-only" htmlFor="gtfs_url">
                GTFS URL
              </label>
              <input
                type="text"
                id="gtfs_url"
                placeholder="Enter URL of zipped GTFS file"
                className="block w-full"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                }}
              />
              <button type="submit" className="block w-[150px]">
                Validate
              </button>
            </form>
          )}
        </>
      )}
      <ToastContainer />
    </>
  );
};

export default UploadForm;