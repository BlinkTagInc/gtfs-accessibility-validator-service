'use client';

import { useState, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useDropzone, FileRejection, FileWithPath } from 'react-dropzone';
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

  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        toast(
          rejectedFiles
            .flatMap((file) =>
              file.errors.map((fileError) => fileError.message),
            )
            .join(', '),
          { type: 'error' },
        );
        return;
      }

      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('file', file);

      setLoading(true);

      try {
        const response = await fetch('/api/validate/file', {
          method: 'POST',
          body: formData,
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
    },
    [],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/x-zip': ['.zip'],
    },
    maxSize: 20 * 1024 * 1024,
    maxFiles: 1,
  });

  return (
    <>
      {validationResults ? (
        <>
          <div>
            <h3 className="mb-0">Validation Results</h3>
            {url && <div className="text-sm">GTFS URL: {url}</div>}
            <div className="text-sm">
              Agency:{' '}
              <span className="font-semibold">{validationResults.agency}</span>
            </div>
            {validationResults.feed_version && (
              <div className="text-sm">
                Feed Version:{' '}
                <span className="font-semibold">
                  {validationResults.feed_version}
                </span>
              </div>
            )}
            {validationResults.feed_start_date && (
              <div className="text-sm">
                Date Range:{' '}
                <span className="font-semibold">
                  {validationResults.feed_start_date} -{' '}
                  {validationResults.feed_end_date}
                </span>
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
            <>
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
                    const response = await fetch('/api/validate/url', {
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
              <div className="text-center text-2xl my-3">OR</div>
              <div
                className="flex items-center justify-center w-full"
                {...getRootProps()}
              >
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <input {...getInputProps()} />
                    <svg
                      className="w-10 h-10 mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      ></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      {isDragActive ? (
                        <span className="font-semibold">
                          Drag &apos;n&apos; drop a zipped GTFS file here
                        </span>
                      ) : (
                        <span>
                          <span className="font-semibold">
                            Click to upload GTFS
                          </span>{' '}
                          or drag &apos;n&apos; drop
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      Zipped GTFS only (MAX. 20MB)
                    </p>
                  </div>
                </label>
              </div>
            </>
          )}
        </>
      )}
      <ToastContainer />
    </>
  );
};

export default UploadForm;
