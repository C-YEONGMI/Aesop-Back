const pick = (source = {}, keys = []) =>
    keys.reduce((result, key) => {
        if (source[key] !== undefined) {
            result[key] = source[key];
        }

        return result;
    }, {});

export default pick;
