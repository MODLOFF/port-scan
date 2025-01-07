const express = require('express');
const net = require('net');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index');
});

async function checkTCPPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let resolved = false;
        
        socket.setTimeout(1500); 

        const cleanup = (status, error = null) => {
            if (!resolved) {
                resolved = true;
                socket.destroy();
                resolve({ status, error });
            }
        };

        socket.on('connect', () => {
            cleanup('açık');
        });

        socket.on('timeout', () => {
            cleanup('kapalı', 'Zaman aşımı');
        });

        socket.on('error', (error) => {
            cleanup('kapalı', error.message);
        });

        try {
            socket.connect(port, host);
        } catch (error) {
            cleanup('kapalı', error.message);
        }
    });
}

app.post('/scan', async (req, res) => {
    const { host, port } = req.body;
    
    if (!host || !port) {
        return res.status(400).json({ status: 'hata', error: 'Host ve port gerekli' });
    }

    try {
        const portNum = parseInt(port);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            return res.status(400).json({ status: 'hata', error: 'Geçersiz port numarası' });
        }

        const result = await checkTCPPort(host.trim(), portNum);
        res.json(result);
    } catch (error) {
        res.status(500).json({ status: 'hata', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Uygulama http://localhost:${port} adresinde çalışıyor`);
}); 