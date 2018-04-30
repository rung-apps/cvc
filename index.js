import { create } from 'rung-sdk';
import { Location, IntegerMultiRange } from 'rung-cli/dist/types';
import Bluebird from 'bluebird';
import agent from 'superagent';
import promisifyAgent from 'superagent-promise';
import { map, mergeAll } from 'ramda';

const request = promisifyAgent(agent, Bluebird);
const connectId = 'AFA08AD46D5808963C58';
const server = `https://api.zanox.com/json/2011-03-01/products?connectid=${connectId}`;

const styles = {
    container: {
        fontFamily: 'Roboto, sans-serif',
        textAlign: 'center',
        fontSize: '12px'
    },
    imageContainer: {
        float: 'left',
        marginRight: '2px',
        marginLeft: '-4px',
        position: 'absolute'
    },
    contentContainer: {
        float: 'right',
        width: '89px',
        marginTop: '6px',
        wordWrap: 'break-word'
    },
    thumbnail: {
        padding: '3px',
        backgroundColor: 'white',
        border: '3px solid silver',
        borderRadius: '30px',
        marginTop: '20px'
    },
    price: {
        marginTop: '17px',
        fontWeight: 'bold'
    }
};

function render(name, image, price) {
    return (
        <div style={ styles.container }>
            <div style={ styles.imageContainer }>
                <img
                    src={ image || 'https://i.imgur.com/NEa4tKe.jpg' }
                    width={ 45 }
                    draggable={ false }
                    style={ styles.thumbnail }
                />
            </div>
            <div style={ styles.contentContainer }>
                { name }
                <div style={ styles.price }>R$ { price },00</div>
            </div>
        </div>
    );
}

function createAlert({ '@id': id, name, price, currency, trackingLinks, description, image }) {
    const thumbnail = image && image.medium;
    return {
        [id]: {
            title: _('{{name}} for {{currency}} {{price}},00', { name, currency, price }),
            content: render(name, thumbnail, price),
            comment: `
                ### ${name} ${_('for')} ${currency} ${price},00
                \n\n
                [${_('Check it out')} CVC](${trackingLinks.trackingLink[0].ppc})

                ${description}
            `,
            resources: [thumbnail]
        }
    };
}

function main(context, done) {
    const { searchTerm, priceRange } = context.params;

    return request.get(server)
        .query({
            programs: '15687',
            items: 20,
            searchtype: 'contextual',
            minprice: priceRange[0],
            maxprice: priceRange[1],
            q: searchTerm
        })
        .then(({ body }) => {
            const search = body.productItems.productItem || [];
            const alerts = mergeAll(map(createAlert, search));
            done({ alerts });
        })
        .catch(() => done({ alerts: {} }));
}

const params = {
    searchTerm: {
        description: _('Local'),
        type: Location,
        required: true
    },
    priceRange: {
        description: _('Select how much you want to pay per day'),
        type: IntegerMultiRange(0, 5000),
        default: [0, 200]
    }
};

export default create(main, {
    params,
    primaryKey: true,
    title: _('Hotels in CVC'),
    description: _('Find the best opportunities and make your booking!'),
    preview: render(
        'Hotel Jabuticabeira',
        'https://i.imgur.com/SPVhJGx.jpg',
        180
    )
});
