function genarate_details(data) {
  let field = "";
  let value = "";

  function giveField(str) {
    return `<p style="padding: 0; margin: 0; boxsizing: border-box; margin-bottom: .5rem;">${str}:</p>`;
  }

  function giveValue(str) {
    return `<p style="padding: 0; margin: 0; boxsizing: border-box; margin-bottom: .5rem;">${str}</p>`;
  }
  Object.keys(data).forEach((key) => {
    field += giveField(key);
    value += giveValue(data[key]);
  });

  return `
        <div class="column" style="padding: 0; margin: 0; boxsizing: border-box; font-size: 1.1rem; margin-top: 1rem; color: #000; font-weight: 700; margin-right: 2rem;">
            ${field}
        </div>

        <div class="column" style="padding: 0; margin: 0; boxsizing: border-box; font-size: 1.1rem; margin-top: 1rem; color: #000;">
            ${value}
        </div>
    `;
}

function bold(str) {
  return `<span style="padding: 0; margin: 0; boxsizing: border-box; font-weight: 700;">${str}</span>`;
}

function GET_HTML(
  heading = "",
  failed = false,
  message = "",
  patient_details = {}
) {
  return `
      <div class="container" style="margin: 0; boxsizing: border-box; padding: 4%; font-family: 'Poppins', sans-serif;"> 
          <p class="heading" style="padding: 0; margin: 0; boxsizing: border-box; font-size: 2rem; font-weight: 700; ${
            failed ? "color: #ff4141;" : "color: #1A69E0;"
          }">${heading}</p>
          <p class="info" style="padding: 0; margin: 0; boxsizing: border-box; margin-top: 1rem; max-width: 35rem; line-height: 1.8rem; color: #000;">${message}</p>
    
          <div class="details" style="padding: 0; margin: 0; boxsizing: border-box; margin-top: 4rem;"> 
              <p class="title" style="padding: 0; margin: 0; boxsizing: border-box; font-weight: 800; text-transform: uppercase; letter-spacing: .05rem; color: #1A69E0;">Patient Details</p>
              <div class="flex" style="padding: 0; margin: 0; boxsizing: border-box; width: 100%; display: flex;">
                  ${genarate_details(patient_details)}
              </div>
          </div>
          
          <p class="end-info" style="padding: 0; margin: 0; boxsizing: border-box; max-width: 300px; font-weight: 500; font-size: 1rem; line-height: 1.6rem; letter-spacing: 0.03em; color: #46494D; margin-top: 5rem;">
              You received this because you're a registered CoHelp user.
          </p>
          <div style="padding: 0; margin: 0; boxsizing: border-box; height: 3rem;"></div>
          <p class="logo-title" style="padding: 0; margin: 0; boxsizing: border-box; font-weight: 600; color: #494C51; font-size: 1.5rem; letter-spacing: 0.03em;">CoHelp</p>
          <p class="logo-details" style="padding: 0; margin: 0; boxsizing: border-box; font-size: .9rem; letter-spacing: 0.03em; color: #72777E; font-weight: 500;">Online Covid Help System</p>
      </div>
      `;
}

module.exports = {
  GET_HTML,
  bold,
};
