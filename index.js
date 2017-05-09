const { create } = require('rung-sdk');
const { String: Text, IntegerRange } = require('rung-sdk/dist/types');
const Bluebird = require('bluebird');
const agent = require('superagent');
const promisifyAgent = require('superagent-promise');
const { map, mergeAll } = require('ramda');

const request = promisifyAgent(agent, Bluebird);
const connectId = '<<<YOUR CONNECT ID>>>'
const server = `https://api.zanox.com/json/2011-03-01/products?connectid=${connectId}`;

function createAlert({ '@id': id, name, price, currency, trackingLinks, description, image }) {
    return {
        [id]:
            {
                title: `${name} por ${currency} ${price},00`,
                comment: `
                    ### ${name} por ${currency} ${price},00
                    \n\n
                    [Confira na CVC](${trackingLinks.trackingLink.ppc})
                    
                    ${description}
                    
                    ![${name}](${image.medium})
                `
            }
    };
}

function main(context, done) {
    const { searchTerm, price } = context.params;

    return request.get(server)
        .query({
            programs: '15687',
            items: 20,
            searchtype: 'contextual',
            minprice: 0,
            maxprice: price,
            q: searchTerm
        })
        .then(({ body }) => {
            const search = body.productItems.productItem || [];
            const alerts = mergeAll(map(createAlert, search));
            done(alerts);
        })
        .catch(() => done([]));
}

const params = {
    searchTerm: {
        description: 'Local',
        type: Text
    },
    price: {
        description: 'Valor',
        type: IntegerRange(0, 10000),
        default: 150
    }
};

const app = create(main, { params, primaryKey: true });

module.exports = app;