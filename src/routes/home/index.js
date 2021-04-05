import style from "./style.css";
import axios from "axios";
import hmacSHA256 from "crypto-js/hmac-sha256";
import { useEffect, useState } from "preact/hooks";
const {PREACT_APP_API_KEY, PREACT_APP_API_SECRET} = process.env

const API_URL = "https://paxful.com/api/offer/all";
const API_KEY = PREACT_APP_API_KEY
const API_SECRET = PREACT_APP_API_SECRET
const payload = `apikey=${API_KEY}&nonce=${Date.now()}&offer_type=buy&payment_method=payoneer&currency_code=USD`;
const payload2 = `apikey=${API_KEY}&nonce=${Date.now()}&offer_type=sell&payment_method=bank-transfer&currency_code=ARS`;
const seal = hmacSHA256(payload, API_SECRET);
const seal2 = hmacSHA256(payload2, API_SECRET);

const Home = () => {
  const [buyers, setBuyers] = useState([]);
  const [selectedBuyer, setSelectedBuyer] = useState();
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState();

  useEffect(() => {
    const options = {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "text/plain" },
      data: payload + "&apiseal=" + seal,
      url: API_URL,
    };
    const options2 = {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "text/plain" },
      data: payload2 + "&apiseal=" + seal2,
      url: API_URL,
    };
    Promise.all([axios(options), axios(options2)])
      .then(function (response) {
        const cleanBuyerList = response[0].data.data.offers
          .sort((a, b) => (a.margin > b.margin ? 1 : -1))
          .filter(
            (user) =>
              user.margin < 10 &&
              user.offer_owner_feedback_positive -
                user.offer_owner_feedback_negative >
                30
          );
        const cleanSellerList = response[1].data.data.offers
          .sort((a, b) => (a.margin < b.margin ? 1 : -1))
          .filter(
            (user) =>
              user.offer_owner_feedback_positive -
                user.offer_owner_feedback_negative >
              30
          );
        setBuyers(cleanBuyerList);
        setSellers(cleanSellerList);
        setSelectedBuyer((prev) => Object.assign({}, cleanBuyerList[0]));
        setSelectedSeller((prev) => Object.assign({}, cleanSellerList[0]));
      })
      .catch(function (error) {
        console.log(error);
      });
  }, []);

  return (
    <div class={style.home}>
      <h1>Home</h1>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around",
          width: "100%",
        }}
      >
        <div>
          <p>{selectedBuyer ? selectedBuyer.offer_owner_username : null}</p>
          <p>{selectedBuyer ? selectedBuyer.fiat_price_per_btc : null}</p>
        </div>
        <div>
          <p>{selectedSeller ? selectedSeller.offer_owner_username : null}</p>
          <p>{selectedSeller ? selectedSeller.fiat_price_per_btc : null}</p>
        </div>
      </div>
      <h2 style={{ textAlign: "center", width: "100%" }}>
        {selectedBuyer && selectedSeller
          ? `Tipo de cambio: ${
              Math.round(
                (selectedSeller.fiat_price_per_btc  /
                  selectedBuyer.fiat_price_per_btc * 0.99) *
                  100
              ) / 100
            }`
          : null}
      </h2>
      <div style={{ width: "100%", display: "flex", flexDirection: "row" }}>
        {buyers && (
          <Table
            title="USD to BTC"
            users={buyers}
            insidekey={"buyer"}
            setSelectedUser={setSelectedBuyer}
          />
        )}
        {sellers && (
          <Table
            title="BTC to ARS"
            users={sellers}
            insidekey={"seller"}
            setSelectedUser={setSelectedSeller}
          />
        )}
      </div>
    </div>
  );
};

export default Home;

const Table = ({ users, insidekey, setSelectedUser, title }) => (
  <div style={{ width: "50%" }}>
    <h2 style={{ textAlign: "center" }}>{title}</h2>
    <table style={{ width: "100%" }}>
      <thead style={{ textAlign: "left" }}>
        <tr>
          <th>User</th>
          <th>Margin</th>
          <th>Price</th>
          <th>Reputation</th>
        </tr>
      </thead>
      <tbody>
        {users
          ? users.map((user, i) => (
              <tr
                key={insidekey + i}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  setSelectedUser((prev) => Object.assign({}, user))
                }
              >
                <td>{user.offer_owner_username}</td>
                <td>{user.margin}</td>
                <td>{Math.round(user.fiat_price_per_btc)}</td>
                <td>
                  {user.offer_owner_feedback_positive -
                    user.offer_owner_feedback_negative}
                </td>
              </tr>
            ))
          : null}
      </tbody>
    </table>
  </div>
);
