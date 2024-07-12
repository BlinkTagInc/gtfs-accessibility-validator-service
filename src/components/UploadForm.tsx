'use client';

import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Loading } from './Loading';

interface ValidationStat {
  name: string;
  status: string;
  value: string;
  routes?: Record<string, string>[];
}

interface ValidationResults {
  stats: ValidationStat[];
  agency: string;
  feed_version: string;
  feed_start_date: number;
  feed_end_date: number;
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
  const [validationResults, setValidationResults] = useState<
    ValidationResults | undefined
  >();
  const [loading, setLoading] = useState(false);

  return (
    <>
      {validationResults ? (
        <>
          <div>
            <h3 className="mb-0">Validation Results</h3>
            <div className="text-sm">GTFS URL: {url}</div>
            <div className="text-sm">Agency: {validationResults.agency}</div>
            {validationResults.feed_version && (
              <div className="text-sm">
                Feed Version: {validationResults.feed_version}
                {validationResults.feed_start_date && (
                  <span> ({validationResults.feed_start_date} - </span>
                )}
                {validationResults.feed_end_date && (
                  <span>{validationResults.feed_end_date})</span>
                )}
              </div>
            )}
            <table className="mt-2">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Item</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {validationResults.stats.map((stat, index) => {
                  let routeList = null;

                  if (stat.routes && stat.routes.length > 0) {
                    routeList = stat.routes.length > 0 && (
                      <span>
                        <br />
                        {stat.routes
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
                        <Status status={stat.status} />
                      </td>
                      <td className="leading-4">
                        {stat.name}
                        {routeList}
                        <br />
                        <a href={`#issue-${index}`} className="text-xs">
                          Details
                        </a>
                      </td>
                      <td>{stat.value}</td>
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
