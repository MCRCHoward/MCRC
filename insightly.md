<div id="modal-form" class="modal hide no-reset in" role="dialog" aria-labelledby="modal-form" aria-hidden="false" style="display: block;">
    <div id="modal-form-header" class="modal-header">
        <button id="mf-close" type="button" class="close" data-dismiss="modal" aria-hidden="true" title="Close"><i class="icon-remove"></i></button>
    <div id="content">
            <header class="head">
                <aside id="links-bar-create-edit">
                    <div class="profile-photo-create-edit">
                            <i class="fa-solid fa-people-group fa-2xl custom-object-profile"></i>
                    </div>
                </aside>
                <div id="obj-type">Create Lead</div>
                <div class="title">
                        <h1>Add New Lead</h1>
                </div>
            </header>
            <header class="header-toolbar-list" id="dropshadow-toolbar-list">
                <div class="title">
                    <div class="btn-group">
                        
    <button type="button" onclick="$.InsWeb3.navigateBack(event);" class="btn long btn-icon" title="Back"><i class="fa-solid fa-turn-left fa-lg"></i></button>


                    </div>

                    <div class="btn-group">
                        <button class="btn long btn-primary form-save" type="button" disabled="">Save</button>
                        <button class="btn btn-primary dropdown-toggle" data-toggle="dropdown" type="button">
                            <span class="caret"></span>
                        </button>
                        <ul id="save-btn-menu" class="dropdown-menu">
                            <li><a class="form-save-another" href="#">Save + Add Another</a></li>
                        </ul>
                    </div>

                    <div class="btn-group">
                        
    <button type="button" onclick="$.InsWeb3.navigateBack(event);" class="btn btn-long discard">Discard</button>


                    </div>
                </div>
            </header>
        </div></div>
    <div id="modal-form-body" class="modal-body"><title>Insightly</title>




<div id="main-container" class="create open-in-modal">
<form action="/Leads/Create" class="dirty-check dirty" id="createForm" method="post">        
        <div id="main-content">
            <div id="detail-main" class="create-edit-detail" data-loaded="true">
                

                

<input name="__RequestVerificationToken" type="hidden" value="J2VRDbuFdMmTeWZnyByw6HLICyNHLGpzbeUOmicOsnB8sxLJ5NmNyWp9At6obvPl_wd6py-2sjDLLpPcw3xofnQQA_b_DPY7uQYvPJf0Fs1S8FPxbhlMNsK5ni1vNgC7sg_LIg2">
<div class="entity-detail ">
    <div class="metadata-page-render" id="2854e701-4e7c-4dab-86a0-b801473074a3" client-side-init="true">
        <div id="metadata-details-error-message" style="display: none;">
            <span></span>
        </div>



<section id="field-render-section-LeadInformation" class="block metadata-section-render" data-section-id="LeadInformation" data-visibility-hidden="False">
    <header class="metadata-section-render-title">
        <h2 class="metadata-section-visibility-trigger">
            <span class="metadata-section-icon icon-chevron-down"></span>Lead Information
        </h2>
    </header>
    <div class="metadata-section-render-content " data-section-id="LeadInformation">




    <div class="metadata-row-render" id="field-render-Name" data-display-type="FULLNAME" data-inline-edit-type="FULLNAME" data-modal-edit-type="" data-full-edit-type="FULLNAME" data-render-id="Name" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Name">
                    Name
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-Name" class="metadata-row-editor-fullname">
    





<input autocomplete="new-password" class="metadata-input-salutation" data-field-id="24" data-field-name="SALUTATION" data-is-lookup="1" id="Lead_SALUTATION" max-length="50" name="SALUTATION" placeholder="Prefix" type="text" value="">
<input autocomplete="new-password" class="metadata-input-firstname" data-field-id="11" data-field-name="FIRST_NAME" data-is-lookup="1" id="Lead_FIRST_NAME" max-length="255" name="FIRST_NAME" placeholder="First Name" type="text" value="">
<span class="input-req" title="Required Field"><input autocomplete="new-password" class="metadata-input-lastname" data-field-id="13" data-field-name="LAST_NAME" data-is-lookup="1" data-required="1" data-val-length="The field Last Name must be a string with a maximum length of 255." data-val-length-max="255" data-val-required="The Last Name field is required." id="Lead_LAST_NAME" max-length="255" name="LAST_NAME" placeholder="Last Name" type="text" value=""><span class="input-req-inner "></span></span>




</div>        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render" id="field-render-Title" data-display-type="TEXT" data-inline-edit-type="TEXT" data-modal-edit-type="" data-full-edit-type="TEXT" data-render-id="Title" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Title">
                    Title
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-Title" class="metadata-row-editor-text metadata-row-editor-mdi-div">


    



<input autocomplete="new-password" class="metadata-input-text " data-field-id="25" data-field-name="TITLE" data-is-lookup="1" fonticon="" id="Lead_TITLE" is-disabled="False" maxlength="255" name="b5f811e1-b19c-4263-bd24-372efc51c5b3" placeholder="Title" type="text" value="">


    


</div>
        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render" id="field-render-Organization" data-display-type="TEXT" data-inline-edit-type="TEXT" data-modal-edit-type="" data-full-edit-type="TEXT" data-render-id="Organization" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Organization">
                    Organization
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-Organization" class="metadata-row-editor-text metadata-row-editor-mdi-div">


    



<input autocomplete="new-password" class="metadata-input-text " data-field-id="10257" data-field-name="ORGANISATION_NAME" data-is-lookup="1" fonticon="" id="Lead_ORGANISATION_NAME" is-disabled="False" maxlength="255" name="096c9f92-3434-4de6-a03e-130f0d1b96cb" placeholder="Organization" type="text" value="">


    


</div>
        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render" id="field-render-LeadStatus" data-display-type="LEADSTATUS" data-inline-edit-type="" data-modal-edit-type="LEADSTATUS" data-full-edit-type="LEADSTATUS" data-render-id="LeadStatus" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Lead Status">
                    Lead Status
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-LeadStatus" class="metadata-row-editor-leadStatus">
    


<span class="input-req" title="Required Field"><select class="show-tick metadata-input-leadStatus  " data-field-id="18" data-field-name="LEAD_STATUS_ID" data-is-lookup="1" data-live-search="false" data-required="1" id="Lead_LEAD_STATUS_ID" name="cc25d29d-9f70-4b5b-9432-5451c9ed8646"><option selected="selected" value="3380784">OPEN - Not Contacted</option>
<option value="3380785">OPEN - Attempted Contact</option>
<option value="3380786">OPEN - Contacted</option>
<option value="3380787">CLOSED - Disqualified</option>
</select><span class="input-req-inner "></span></span>


    


</div>        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render" id="field-render-UserResponsible" data-display-type="DROPDOWN" data-inline-edit-type="USERDROPDOWN" data-modal-edit-type="" data-full-edit-type="USERDROPDOWN" data-render-id="UserResponsible" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="User Responsible">
                    User Responsible
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-UserResponsible" class="metadata-row-editor-userDropdown">
    


<select class="show-tick metadata-input-userDropdown  " data-field-id="23" data-field-name="RESPONSIBLE_USER_ID" data-is-lookup="1" data-live-search="false" field-value="2221466" id="Lead_RESPONSIBLE_USER_ID" name="6b51c993-1bbf-45d7-8eb1-1c1710ffd0ca"><option selected="selected" value="2221466">Director MCRC</option>
<option value="2056078">Info MCRC</option>
<option value="2056140">Kerry Stephen</option>
</select>


    


</div>        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render hidden" id="field-render-Owner" data-display-type="CONTACTLINK" data-inline-edit-type="" data-modal-edit-type="" data-full-edit-type="DROPDOWN" data-render-id="Owner" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Lead Owner">
                    Lead Owner
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">




<div id="field-editor-Owner" class="metadata-row-editor-dropdown">
    


<select class="show-tick metadata-input-dropdown  " data-field-id="21" data-field-name="OWNER_USER_ID" data-is-lookup="1" data-live-search="false" field-value="2221466" id="Lead_OWNER_USER_ID" name="3679232f-676b-427d-a98d-e045afa8f061"><option selected="selected" value="2221466">Director MCRC</option>
<option value="2056078">Info MCRC</option>
<option value="2056140">Kerry Stephen</option>
</select>


    


</div>

<script>
     (function () {
     })();
</script>
        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render" id="field-render-LeadRating" data-display-type="RATING" data-inline-edit-type="" data-modal-edit-type="RATING" data-full-edit-type="RATING" data-render-id="LeadRating" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Lead Rating">
                    Lead Rating
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-LeadRating" class="metadata-row-editor-rating">
    

<input class="metadata-input-rating" data-field-id="16" data-field-name="LEAD_RATING" data-is-lookup="1" id="Lead_LEAD_RATING" max="5" min="0" name="b9458d4e-3664-46a9-8992-c4e3affacdc6" placeholder="" type="number" value="">

    


</div>        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>
    </div>
</section>


<section id="field-render-section-AdditionalInformation" class="block metadata-section-render" data-section-id="AdditionalInformation" data-visibility-hidden="False">
    <header class="metadata-section-render-title">
        <h2 class="metadata-section-visibility-trigger">
            <span class="metadata-section-icon icon-chevron-down"></span>Additional Information
        </h2>
    </header>
    <div class="metadata-section-render-content " data-section-id="AdditionalInformation">




    <div class="metadata-row-render" id="field-render-EmailAddress" data-display-type="EMAIL" data-inline-edit-type="EMAIL" data-modal-edit-type="" data-full-edit-type="EMAIL" data-render-id="EmailAddress" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Email Address">
                    Email Address
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-EmailAddress" class="metadata-row-editor-email metadata-row-editor-mdi-div">
    


<input autocomplete="new-password" class="metadata-input-email metadata-row-editor-mdi-input" data-field-id="8" data-field-name="EMAIL" data-is-lookup="1" id="Lead_EMAIL" maxlength="255" name="53f2cdb2-6f2c-40e1-a8e3-390105a51bdd" placeholder="Email Address" type="text" value="">    <i class="input-date fa-solid fa-envelope fa-lg"></i>



    


</div>        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render" id="field-render-EmailOptedOut" data-display-type="CHECKBOX" data-inline-edit-type="CHECKBOX" data-modal-edit-type="" data-full-edit-type="CHECKBOX" data-render-id="EmailOptedOut" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Email Opted Out">
                    Email Opted Out
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-EmailOptedOut" class="metadata-row-editor-checkbox">
    

<input class="metadata-input-checkbox" data-field-id="11498" data-field-name="EMAIL_OPTED_OUT" data-is-lookup="1" id="Lead_EMAIL_OPTED_OUT" name="92418eb7-2431-44db-9e89-1f7e4f148d76" type="checkbox" value="true"><input name="92418eb7-2431-44db-9e89-1f7e4f148d76" type="hidden" value="false">
    


</div>        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render" id="field-render-Phone" data-display-type="PHONE" data-inline-edit-type="PHONE" data-modal-edit-type="" data-full-edit-type="PHONE" data-render-id="Phone" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Phone">
                    Phone
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-Phone" class="metadata-row-editor-phone metadata-row-editor-mdi-div">
    



<input autocomplete="new-password" class="metadata-input-phone metadata-row-editor-mdi-input" data-field-id="22" data-field-name="PHONE" data-is-lookup="1" fonticon="phone" id="Lead_PHONE" maxlength="255" name="5a614d1c-eb45-45e3-83f3-2eb04d216290" placeholder="Phone" type="text" value="">    <i class="input-date fa-solid fa-phone fa-lg" title="Phone Field"></i>



    


</div>
        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render" id="field-render-PhoneMobile" data-display-type="PHONE" data-inline-edit-type="PHONE" data-modal-edit-type="" data-full-edit-type="PHONE" data-render-id="PhoneMobile" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Mobile Phone">
                    Mobile Phone
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-PhoneMobile" class="metadata-row-editor-phone metadata-row-editor-mdi-div">
    



<input autocomplete="new-password" class="metadata-input-phone metadata-row-editor-mdi-input" data-field-id="19" data-field-name="MOBILE" data-is-lookup="1" fonticon="phone" id="Lead_MOBILE" maxlength="255" name="ba095acd-1c02-4c61-b9a4-c4c7ca5ba956" placeholder="Phone (Mobile)" type="text" value="">    <i class="input-date fa-solid fa-phone fa-lg" title="Phone Field"></i>



    


</div>
        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render" id="field-render-Fax" data-display-type="PHONE" data-inline-edit-type="PHONE" data-modal-edit-type="" data-full-edit-type="PHONE" data-render-id="Fax" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Fax">
                    Fax
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-Fax" class="metadata-row-editor-phone metadata-row-editor-mdi-div">
    



<input autocomplete="new-password" class="metadata-input-phone metadata-row-editor-mdi-input" data-field-id="10" data-field-name="FAX" data-is-lookup="1" fonticon="fax" id="Lead_FAX" maxlength="255" name="ee4b3b25-db4f-4d81-a5e1-6c8250e1c61f" placeholder="Fax" type="text" value="">    <i class="input-date fa-solid fa-fax fa-lg" title="Phone Field"></i>



    


</div>
        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render" id="field-render-Website" data-display-type="WEBSITE" data-inline-edit-type="WEBSITE" data-modal-edit-type="" data-full-edit-type="WEBSITE" data-render-id="Website" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Website">
                    Website
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-Website" class="metadata-row-editor-website metadata-row-editor-mdi-div">
    


<input autocomplete="new-password" class="metadata-input-website metadata-row-editor-mdi-input" data-field-id="26" data-field-name="WEBSITE" data-is-lookup="1" id="Lead_WEBSITE" maxlength="255" name="08144f3b-357f-42d1-a2ff-768d19d6ce22" placeholder="Website" type="text" value="">    <i class="input-date fa-solid fa-globe fa-lg" title="Website field"></i>



    


</div>        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render" id="field-render-Industry" data-display-type="TEXT" data-inline-edit-type="TEXT" data-modal-edit-type="" data-full-edit-type="TEXT" data-render-id="Industry" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Industry">
                    Industry
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-Industry" class="metadata-row-editor-text metadata-row-editor-mdi-div">


    



<input autocomplete="new-password" class="metadata-input-text " data-field-id="12" data-field-name="INDUSTRY" data-is-lookup="1" fonticon="" id="Lead_INDUSTRY" is-disabled="False" maxlength="128" name="d297b931-3fdb-4c25-bec8-157916b47b2f" placeholder="Industry" type="text" value="">


    


</div>
        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render" id="field-render-NumberofEmployees" data-display-type="NUMERIC" data-inline-edit-type="INTEGER" data-modal-edit-type="" data-full-edit-type="INTEGER" data-render-id="NumberofEmployees" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Number of Employees">
                    Number of Employees
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-NumberofEmployees" class="metadata-row-editor-integer">
    

<input autocomplete="new-password" class="metadata-input-integer" data-field-id="9" data-field-name="EMPLOYEE_COUNT" data-is-lookup="1" id="Lead_EMPLOYEE_COUNT" name="433469bd-c373-44ae-8aea-10647b8460e1" placeholder="Number of Employees" step="1" type="text" value="">


    


</div>        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>




    <div class="metadata-row-render" id="field-render-LeadSource" data-display-type="DROPDOWN" data-inline-edit-type="DROPDOWN" data-modal-edit-type="" data-full-edit-type="DROPDOWN" data-render-id="LeadSource" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Lead Source">
                    Lead Source
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">




<div id="field-editor-LeadSource" class="metadata-row-editor-dropdown">
    


<span class="input-req" title="Required Field"><select class="show-tick metadata-input-dropdown" data-field-id="17" data-field-name="LEAD_SOURCE_ID" data-is-lookup="1" data-live-search="false" data-required="1" field-value="3442168" id="Lead_LEAD_SOURCE_ID" name="9058af2a-cb4e-4272-82d4-8febfec33bcb"><option value="">Nothing Selected</option>
<option selected="selected" value="3442168">Web</option>
<option value="3442169">Phone Enquiry</option>
<option value="3442170">Partner Referral</option>
<option value="3442171">Purchased List</option>
<option value="3442172">Other</option>
</select><span class="input-req-inner "></span></span>


    


</div>

<script>
     (function () {
     })();
</script>
        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>
    </div>
</section>


<section id="field-render-section-Address" class="block metadata-section-render" data-section-id="Address" data-visibility-hidden="False">
    <header class="metadata-section-render-title">
        <h2 class="metadata-section-visibility-trigger">
            <span class="metadata-section-icon icon-chevron-down"></span>Address
        </h2>
    </header>
    <div class="metadata-section-render-content " data-section-id="Address">




    <div class="metadata-row-render" id="field-render-Address" data-display-type="ADDRESS" data-inline-edit-type="ADDRESS" data-modal-edit-type="" data-full-edit-type="ADDRESS" data-render-id="Address" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Address">
                    Address
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="metadata-field-editor-Address" class="metadata-row-editor-address">
    

<div class="field-render-line">
    <textarea autocomplete="new-password" class="metadata-input-street" cols="20" data-field-id="27" data-field-name="ADDRESS_STREET" data-is-lookup="1" id="Lead_ADDRESS_STREET" name="1064c3c4-4c59-4d75-9446-c4290d381907" placeholder="Street" rows="2" value=""></textarea>
</div>
<div class="field-render-line">
    <input autocomplete="new-password" class="metadata-input-city" data-field-id="28" data-field-name="ADDRESS_CITY" data-is-lookup="1" id="Lead_ADDRESS_CITY" maxlength="200" name="f38cabf7-1212-4ca0-aeb1-2b7e962704f0" placeholder="City" type="text" value="">
    <input autocomplete="new-password" class="metadata-input-state" data-field-id="29" data-field-name="ADDRESS_STATE" data-is-lookup="1" id="Lead_ADDRESS_STATE" maxlength="200" name="0854016a-fe7e-4b02-930e-cf20d502cff0" placeholder="State/Province" type="text" value="">
</div>
<div class="field-render-line">
    <input autocomplete="new-password" class="metadata-input-postcode" data-field-id="30" data-field-name="ADDRESS_POSTCODE" data-is-lookup="1" id="Lead_ADDRESS_POSTCODE" maxlength="128" name="f8a9e445-d850-4ed2-8c96-d369acd64ce9" placeholder="Postal Code" type="text" value="">
    <select autocomplete="off" class="selectpicker show-tick metadata-input-country" data-field-id="31" data-field-name="ADDRESS_COUNTRY" data-is-lookup="1" data-live-search="true" id="Lead_ADDRESS_COUNTRY" maxlength="255" name="Lead_ADDRESS_COUNTRY"><option value="">Country...</option>
<option value="Aaland Islands">Aaland Islands</option>
<option value="Afghanistan">Afghanistan</option>
<option value="Albania">Albania</option>
<option value="Algeria">Algeria</option>
<option value="American Samoa">American Samoa</option>
<option value="Andorra">Andorra</option>
<option value="Angola">Angola</option>
<option value="Anguilla">Anguilla</option>
<option value="Antarctica">Antarctica</option>
<option value="Antigua And Barbuda">Antigua and Barbuda</option>
<option value="Argentina">Argentina</option>
<option value="Armenia">Armenia</option>
<option value="Aruba">Aruba</option>
<option value="Australia">Australia</option>
<option value="Austria">Austria</option>
<option value="Azerbaijan">Azerbaijan</option>
<option value="Bahamas">Bahamas</option>
<option value="Bahrain">Bahrain</option>
<option value="Bangladesh">Bangladesh</option>
<option value="Barbados">Barbados</option>
<option value="Belarus">Belarus</option>
<option value="Belgium">Belgium</option>
<option value="Belize">Belize</option>
<option value="Benin">Benin</option>
<option value="Bermuda">Bermuda</option>
<option value="Bhutan">Bhutan</option>
<option value="Bolivia">Bolivia</option>
<option value="Bosnia And Herzegowina">Bosnia And Herzegowina</option>
<option value="Botswana">Botswana</option>
<option value="Bouvet Island">Bouvet Island</option>
<option value="Brazil">Brazil</option>
<option value="British Indian Ocean Territory">British Indian Ocean Territory</option>
<option value="British Virgin Islands">British Virgin Islands</option>
<option value="Brunei Darussalam">Brunei Darussalam</option>
<option value="Bulgaria">Bulgaria</option>
<option value="Burkina Faso">Burkina Faso</option>
<option value="Burundi">Burundi</option>
<option value="Cambodia">Cambodia</option>
<option value="Cameroon">Cameroon</option>
<option value="Canada">Canada</option>
<option value="Cape Verde">Cape Verde</option>
<option value="Cayman Islands">Cayman Islands</option>
<option value="Central African Republic">Central African Republic</option>
<option value="Chad">Chad</option>
<option value="Chile">Chile</option>
<option value="China">China</option>
<option value="Christmas Island">Christmas Island</option>
<option value="Cocos (Keeling) Islands">Cocos (Keeling) Islands</option>
<option value="Colombia">Colombia</option>
<option value="Comoros">Comoros</option>
<option value="Congo, Democratic Republic Of">Congo, Democratic Republic Of</option>
<option value="Congo, Republic Of">Congo, Republic Of</option>
<option value="Cook Islands">Cook Islands</option>
<option value="Costa Rica">Costa Rica</option>
<option value="Cote D'ivoire">Cote D'ivoire</option>
<option value="Croatia">Croatia</option>
<option value="Cuba">Cuba</option>
<option value="Curacao">Curacao</option>
<option value="Cyprus">Cyprus</option>
<option value="Czech Republic">Czech Republic</option>
<option value="Denmark">Denmark</option>
<option value="Djibouti">Djibouti</option>
<option value="Dominica">Dominica</option>
<option value="Dominican Republic">Dominican Republic</option>
<option value="Ecuador">Ecuador</option>
<option value="Egypt">Egypt</option>
<option value="El Salvador">El Salvador</option>
<option value="Equatorial Guinea">Equatorial Guinea</option>
<option value="Eritrea">Eritrea</option>
<option value="Estonia">Estonia</option>
<option value="Ethiopia">Ethiopia</option>
<option value="Falkland Islands">Falkland Islands</option>
<option value="Faroe Islands">Faroe Islands</option>
<option value="Fiji">Fiji</option>
<option value="Finland">Finland</option>
<option value="France">France</option>
<option value="French Guiana">French Guiana</option>
<option value="French Polynesia">French Polynesia</option>
<option value="French Southern Territories">French Southern Territories</option>
<option value="Gabon">Gabon</option>
<option value="Gambia">Gambia</option>
<option value="Georgia">Georgia</option>
<option value="Germany">Germany</option>
<option value="Ghana">Ghana</option>
<option value="Gibraltar">Gibraltar</option>
<option value="Greece">Greece</option>
<option value="Greenland">Greenland</option>
<option value="Grenada">Grenada</option>
<option value="Guadeloupe">Guadeloupe</option>
<option value="Guam">Guam</option>
<option value="Guatemala">Guatemala</option>
<option value="Guinea">Guinea</option>
<option value="Guinea-Bissau">Guinea-Bissau</option>
<option value="Guyana">Guyana</option>
<option value="Haiti">Haiti</option>
<option value="Heard And Mc Donald Islands">Heard And Mc Donald Islands</option>
<option value="Honduras">Honduras</option>
<option value="Hong Kong">Hong Kong</option>
<option value="Hungary">Hungary</option>
<option value="Iceland">Iceland</option>
<option value="India">India</option>
<option value="Indonesia">Indonesia</option>
<option value="Iran">Iran</option>
<option value="Iraq">Iraq</option>
<option value="Ireland">Ireland</option>
<option value="Israel">Israel</option>
<option value="Italy">Italy</option>
<option value="Jamaica">Jamaica</option>
<option value="Japan">Japan</option>
<option value="Jordan">Jordan</option>
<option value="Kazakhstan">Kazakhstan</option>
<option value="Kenya">Kenya</option>
<option value="Kiribati">Kiribati</option>
<option value="Kosovo">Kosovo</option>
<option value="Kuwait">Kuwait</option>
<option value="Kyrgyzstan">Kyrgyzstan</option>
<option value="Laos">Laos</option>
<option value="Latvia">Latvia</option>
<option value="Lebanon">Lebanon</option>
<option value="Lesotho">Lesotho</option>
<option value="Liberia">Liberia</option>
<option value="Libya">Libya</option>
<option value="Liechtenstein">Liechtenstein</option>
<option value="Lithuania">Lithuania</option>
<option value="Luxembourg">Luxembourg</option>
<option value="Macau">Macau</option>
<option value="Macedonia">Macedonia</option>
<option value="Madagascar">Madagascar</option>
<option value="Malawi">Malawi</option>
<option value="Malaysia">Malaysia</option>
<option value="Maldives">Maldives</option>
<option value="Mali">Mali</option>
<option value="Malta">Malta</option>
<option value="Marshall Islands">Marshall Islands</option>
<option value="Martinique">Martinique</option>
<option value="Mauritania">Mauritania</option>
<option value="Mauritius">Mauritius</option>
<option value="Mayotte">Mayotte</option>
<option value="Mexico">Mexico</option>
<option value="Micronesia">Micronesia</option>
<option value="Moldova">Moldova</option>
<option value="Monaco">Monaco</option>
<option value="Mongolia">Mongolia</option>
<option value="Montenegro">Montenegro</option>
<option value="Montserrat">Montserrat</option>
<option value="Morocco">Morocco</option>
<option value="Mozambique">Mozambique</option>
<option value="Myanmar">Myanmar</option>
<option value="Namibia">Namibia</option>
<option value="Nauru">Nauru</option>
<option value="Nepal">Nepal</option>
<option value="Netherlands">Netherlands</option>
<option value="Netherlands Antilles">Netherlands Antilles</option>
<option value="New Caledonia">New Caledonia</option>
<option value="New Zealand">New Zealand</option>
<option value="Nicaragua">Nicaragua</option>
<option value="Niger">Niger</option>
<option value="Nigeria">Nigeria</option>
<option value="Niue">Niue</option>
<option value="Norfolk Island">Norfolk Island</option>
<option value="North Korea">North Korea</option>
<option value="Northern Mariana Islands">Northern Mariana Islands</option>
<option value="Norway">Norway</option>
<option value="Oman">Oman</option>
<option value="Pakistan">Pakistan</option>
<option value="Palau">Palau</option>
<option value="Palestinian Territory">Palestinian Territory</option>
<option value="Panama">Panama</option>
<option value="Papua New Guinea">Papua New Guinea</option>
<option value="Paraguay">Paraguay</option>
<option value="Peru">Peru</option>
<option value="Philippines">Philippines</option>
<option value="Pitcairn">Pitcairn</option>
<option value="Poland">Poland</option>
<option value="Portugal">Portugal</option>
<option value="Puerto Rico">Puerto Rico</option>
<option value="Qatar">Qatar</option>
<option value="Republic of Somaliland">Republic of Somaliland</option>
<option value="Reunion">Reunion</option>
<option value="Romania">Romania</option>
<option value="Russia">Russia</option>
<option value="Rwanda">Rwanda</option>
<option value="Saint Helena">Saint Helena</option>
<option value="Saint Kitts And Nevis">Saint Kitts And Nevis</option>
<option value="Saint Lucia">Saint Lucia</option>
<option value="Saint Pierre And Miquelon">Saint Pierre And Miquelon</option>
<option value="Saint Vincent And The Grenadines">Saint Vincent and the Grenadines</option>
<option value="Samoa">Samoa</option>
<option value="San Marino">San Marino</option>
<option value="Sao Tome And Principe">Sao Tome And Principe</option>
<option value="Saudi Arabia">Saudi Arabia</option>
<option value="Senegal">Senegal</option>
<option value="Serbia">Serbia</option>
<option value="Seychelles">Seychelles</option>
<option value="Sierra Leone">Sierra Leone</option>
<option value="Singapore">Singapore</option>
<option value="Slovakia">Slovakia</option>
<option value="Slovenia">Slovenia</option>
<option value="Solomon Islands">Solomon Islands</option>
<option value="Somalia">Somalia</option>
<option value="South Africa">South Africa</option>
<option value="South Georgia">South Georgia</option>
<option value="South Korea">South Korea</option>
<option value="South Sudan">South Sudan</option>
<option value="Spain">Spain</option>
<option value="Sri Lanka">Sri Lanka</option>
<option value="Sudan">Sudan</option>
<option value="Suriname">Suriname</option>
<option value="Svalbard And Jan Mayen Islands">Svalbard And Jan Mayen Islands</option>
<option value="Swaziland">Swaziland</option>
<option value="Sweden">Sweden</option>
<option value="Switzerland">Switzerland</option>
<option value="Syria">Syria</option>
<option value="Taiwan">Taiwan</option>
<option value="Tajikistan">Tajikistan</option>
<option value="Tanzania">Tanzania</option>
<option value="Thailand">Thailand</option>
<option value="Timor-Leste">Timor Leste</option>
<option value="Togo">Togo</option>
<option value="Tokelau">Tokelau</option>
<option value="Tonga">Tonga</option>
<option value="Trinidad And Tobago">Trinidad And Tobago</option>
<option value="Tunisia">Tunisia</option>
<option value="Turkey">Turkey</option>
<option value="Turkmenistan">Turkmenistan</option>
<option value="Turks And Caicos Islands">Turks And Caicos Islands</option>
<option value="Tuvalu">Tuvalu</option>
<option value="Uganda">Uganda</option>
<option value="Ukraine">Ukraine</option>
<option value="United Arab Emirates">United Arab Emirates</option>
<option value="United Kingdom">United Kingdom</option>
<option selected="selected" value="United States">United States</option>
<option value="United States Minor Outlying Islands">United States Minor Outlying Islands</option>
<option value="United States Virgin Islands">United States Virgin Islands</option>
<option value="Uruguay">Uruguay</option>
<option value="Uzbekistan">Uzbekistan</option>
<option value="Vanuatu">Vanuatu</option>
<option value="Vatican City">VaticanCity</option>
<option value="Venezuela">Venezuela</option>
<option value="Vietnam">Vietnam</option>
<option value="Wallis And Futuna Islands">Wallis And Futuna Islands</option>
<option value="Western Sahara">Western Sahara</option>
<option value="Yemen">Yemen</option>
<option value="Zambia">Zambia</option>
<option value="Zimbabwe">Zimbabwe</option>
</select>
</div>

    


</div>        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>
    </div>
</section>


<section id="field-render-section-Description" class="block metadata-section-render" data-section-id="Description" data-visibility-hidden="False">
    <header class="metadata-section-render-title">
        <h2 class="metadata-section-visibility-trigger">
            <span class="metadata-section-icon icon-chevron-down"></span>Description Information
        </h2>
    </header>
    <div class="metadata-section-render-content " data-section-id="Description">




    <div class="metadata-row-render" id="field-render-Description" data-display-type="MULTILINETEXT" data-inline-edit-type="MULTILINETEXT" data-modal-edit-type="" data-full-edit-type="MULTILINETEXT" data-render-id="Description" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Description">
                    Description
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">



<div id="field-editor-Description" class="metadata-row-editor-textarea">
    

<textarea autocomplete="new-password" class="metadata-input-textarea" cols="20" data-field-id="14" data-field-name="LEAD_DESCRIPTION" data-is-lookup="1" id="Lead_LEAD_DESCRIPTION" maxlength="4000" name="0ba9d82a-1885-4767-8e90-8ff3a117789f" placeholder="Description" rows="7"></textarea>


    


</div>        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>
    </div>
</section>


<section id="field-render-section-Tag" class="block metadata-section-render" data-section-id="Tag" data-visibility-hidden="False">
    <header class="metadata-section-render-title">
        <h2 class="metadata-section-visibility-trigger">
            <span class="metadata-section-icon icon-chevron-down"></span>Tag Information
        </h2>
    </header>
    <div class="metadata-section-render-content " data-section-id="Tag">




    <div class="metadata-row-render" id="field-render-Tags" data-display-type="TAG" data-inline-edit-type="" data-modal-edit-type="TAG" data-full-edit-type="TAG" data-render-id="Tags" data-render-mode="CREATE">

        <div class="metadata-row-title">
                <span class="title" title="Tag List">
                    Tag List
                </span>
        </div>

        <span class="metadata-field-spinner-container">
        </span>
        <div class="metadata-row-viewer" style="display:none;">
        </div>
        <div class="metadata-row-editor" data-readonly="false" style="display: inline-block;">




<div id="tag-editor-value-38" class="metadata-row-editor-tag">
    

<div autocomplete="new-password" data-entity-type="Lead" data-field-id="38" data-field-name="LeadTagList" data-is-lookup="1" id="field-editor-content-tags"><div class="select2-container select2-container-multi metadata-input-tag" id="s2id_autogen1" style="width: 432px">    <ul class="select2-choices">  <li class="select2-search-field">    <input type="text" autocomplete="off" class="select2-input select2-default" style="width: 0px;">  </li></ul><div class="select2-drop select2-drop-multi" style="display:none;">   <ul class="select2-results">   </ul></div></div><input class="metadata-input-tag" name="3a66010f-a33e-4324-9497-88d5d8408657" placeholder="" style="width: 432px; display: none;" type="text" value=""></div>


    



</div>        </div>
        <div class="metadata-row-modal modal hide no-reset" style="display: none;" role="dialog">
        </div>
    </div>
    </div>
</section>


<section id="field-render-section-LeadConversionDetails" class="block metadata-section-render hidden" data-section-id="LeadConversionDetails" data-visibility-hidden="False">
    <header class="metadata-section-render-title">
        <h2 class="metadata-section-visibility-trigger">
            <span class="metadata-section-icon icon-chevron-down"></span>Lead Conversion Details
        </h2>
    </header>
    <div class="metadata-section-render-content " data-section-id="LeadConversionDetails">
    </div>
</section>

    </div>
</div>
<script>
    $(function () {
        $.MetadataClientSideObjectInit(
            {
                Localization_ClickToEdit:"Click to Edit",
                Localization_Edit: "Edit",
                InstanceId: 1119169,
                EntityId: 0,
                EntityType: "Lead",
                LayoutId: "1",
                IsLookUp: "True",
                LookupObjectId: "2",
                RenderMode: "CREATE",
                LookupRelationshipFieldTitles: null,
                PageRenderDOM: $("#2854e701-4e7c-4dab-86a0-b801473074a3"),
                RelatedEntityId: "",
                RelatedEntityType: ""
            }
        );
        $.InsWeb3.DetailsController.detailsControllerSetScrollPosition();

        $.InsWeb3.DynamicLayoutRulesController.init([],
            {},
            'CREATE',
            {"LEAD_STATUS_ID":3380784,"LEAD_SOURCE_ID":3442168,"OWNER_USER_ID":2221466},
            "Lead",
            "");

    });
</script>

            </div>
        </div>
        <input type="hidden" id="EntityId" name="EntityId">
        <input id="EntityType" name="EntityType" type="hidden" value="Lead">
        <input id="RelatedFieldName" name="RelatedFieldName" type="hidden">
        <input id="RelatedEntityType" name="RelatedEntityType" type="hidden">
<input data-val="true" data-val-number="The field RelatedEntityId must be a number." id="RelatedEntityId" name="RelatedEntityId" type="hidden" value=""><input data-val="true" data-val-required="The Mode field is required." id="Mode" name="Mode" type="hidden" value="Create"><input id="RedirectType" name="RedirectType" type="hidden" value="">        <input type="hidden" id="PreviousEntityFormGuid">
        <input type="hidden" id="actionType" value="Create">
        <input type="hidden" id="isBulkCommand" value="false">
<input type="hidden" name="__CustomRequestVerificationToken" value="hxrlj-Aepp1igHXRWxlTKzvnLg9tQ9edNhPbOR4-4ij4q7_XVlQ6IlCABWVoRcqNEdmadxBplj8ryBZHyfRePlY2meG_4IuzDv28mQxm5u_aWyZ3LypMd0ChfS8a96eqp28IKw2"></form></div>

<script>
    $(function () {
        $.MetadataClientSidePageInit("Create", { EntityType: 'Lead', Mode: 'Create', SaveAndReturn: 'False' });
    });
</script>

<script>
        (function () {
            $.InsWeb3.initCSRFProtection('__CustomRequestVerificationToken', '7LH5ywoltHztjZ26y1L2g6QamqC_wjSiQhucw-lG92RFDUL7L0JCTI1B9Jhs7_T7ifkNLL9KDV_WA9ZVEcnQzqewqxI1:hxrlj-Aepp1igHXRWxlTKzvnLg9tQ9edNhPbOR4-4ij4q7_XVlQ6IlCABWVoRcqNEdmadxBplj8ryBZHyfRePlY2meG_4IuzDv28mQxm5u_aWyZ3LypMd0ChfS8a96eqp28IKw2');
        })();
</script></div>
    <div class="modal-footer">
        <img class="spinnerholder" style="display: none; margin-right: 20px;" src="/img/spinner.gif">
        <div id="leftFooterButton"></div>
        <button class="btn" data-dismiss="modal" aria-hidden="true" id="btnCancel">Cancel</button>
        <button class="btn" id="btn-previous" style="display: none;">Previous</button>
        <button class="btn" id="btnSaveAndNew" style="" disabled="">Save &amp; New</button>
        <button class="btn btn-primary" id="btn-save-and-return" style="display: none;" disabled="">Save &amp; Return</button>
        <button class="btn btn-primary" id="btn-save" disabled="">Save</button>
    </div>
</div>
