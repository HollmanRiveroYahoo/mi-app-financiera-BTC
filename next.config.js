const fs = require('fs');

const originalReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function (path, options) {
  try {
    return originalReadlinkSync(path, options);
  } catch (err) {
    if (err.code === 'EISDIR') {
      try {
        if (!fs.statSync(path).isDirectory()) {
          err.code = 'EINVAL';
        }
      } catch (e) {}
    }
    throw err;
  }
};

const originalReadlink = fs.readlink;
fs.readlink = function (path, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  originalReadlink(path, options, (err, linkString) => {
    if (err && err.code === 'EISDIR') {
      fs.stat(path, (statErr, stats) => {
        if (!statErr && !stats.isDirectory()) {
          err.code = 'EINVAL';
        }
        callback(err, linkString);
      });
      return;
    }
    callback(err, linkString);
  });
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.STANDALONE === 'true' ? { output: 'standalone' } : {}),
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
