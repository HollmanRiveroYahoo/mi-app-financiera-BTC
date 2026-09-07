const fs = require('fs');
const origReadlink = fs.readlink;
const origReadlinkSync = fs.readlinkSync;
if (origReadlink) {
    fs.readlink = function(...args) {
        const cb = args.pop();
        origReadlink(...args, (err, target) => {
            if (err && err.code === 'EISDIR') err.code = 'EINVAL';
            cb(err, target);
        });
    };
}
if (origReadlinkSync) {
    fs.readlinkSync = function(...args) {
        try {
            return origReadlinkSync(...args);
        } catch (err) {
            if (err.code === 'EISDIR') err.code = 'EINVAL';
            throw err;
        }
    };
}
if (fs.promises && fs.promises.readlink) {
    const origPromisesReadlink = fs.promises.readlink;
    fs.promises.readlink = async function(...args) {
        try {
            return await origPromisesReadlink(...args);
        } catch (err) {
            if (err.code === 'EISDIR') err.code = 'EINVAL';
            throw err;
        }
    };
}
