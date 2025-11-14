import React from "react";

interface StructuredContentViewProps {
  data: unknown;
  title?: string;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const formatLabel = (key: string) =>
  key
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const renderValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400">未提供</span>;
  }

  if (typeof value === "string") {
    const lines = value.trim().split(/\n+/);
    if (lines.length > 1) {
      return (
        <ul className="ml-4 list-disc space-y-1 text-gray-700">
          {lines.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      );
    }
    return <span className="text-gray-700">{value}</span>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="text-gray-700">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-400">暂无数据</span>;
    }

    if (value.every((item) => typeof item === "string" || typeof item === "number")) {
      return (
        <ul className="ml-4 list-disc space-y-1 text-gray-700">
          {value.map((item, index) => (
            <li key={index}>{String(item)}</li>
          ))}
        </ul>
      );
    }

    if (value.every((item) => isPlainObject(item))) {
      const keys = Array.from(
        value
          .reduce((acc, item) => {
            Object.keys(item).forEach((key) => acc.add(key));
            return acc;
          }, new Set<string>())
          .values()
      );

      return (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-xs">
            <thead className="bg-gray-100">
              <tr>
                {keys.map((key) => (
                  <th key={key} className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200">
                    {formatLabel(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {value.map((item, rowIndex) => (
                <tr key={rowIndex}>
                  {keys.map((key) => (
                    <td key={key} className="px-3 py-2 align-top text-gray-700">
                      {renderValue((item as Record<string, unknown>)[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <StructuredContentView data={item} />
          </div>
        ))}
      </div>
    );
  }

  if (isPlainObject(value)) {
    return (
      <dl className="space-y-2">
        {Object.entries(value).map(([key, nestedValue]) => (
          <div key={key}>
            <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {formatLabel(key)}
            </dt>
            <dd className="mt-1 text-sm">
              <StructuredContentView data={nestedValue} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <pre className="overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
};

const StructuredContentView: React.FC<StructuredContentViewProps> = ({ data, title }) => {
  if (data === null || data === undefined || (typeof data === "string" && data.trim() === "")) {
    return null;
  }

  return (
    <div className="space-y-3">
      {title && <h4 className="text-sm font-semibold text-gray-800">{title}</h4>}
      {renderValue(data)}
    </div>
  );
};

export default StructuredContentView;


