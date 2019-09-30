/*
 * Zed Attack Proxy (ZAP) and its related class files.
 *
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 *
 * Copyright 2018 The ZAP Development Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.zaproxy.zap.extension.hud;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.httpclient.URI;
import org.apache.commons.httpclient.URIException;
import org.apache.log4j.Logger;
import org.parosproxy.paros.core.proxy.OverrideMessageProxyListener;
import org.parosproxy.paros.network.HttpHeader;
import org.parosproxy.paros.network.HttpMessage;
import org.parosproxy.paros.network.HttpResponseHeader;
import org.zaproxy.zap.ZAP;
import org.zaproxy.zap.eventBus.Event;

public class HttpUpgradeProxyListener implements OverrideMessageProxyListener {

    // Based on an example on
    // https://stackoverflow.com/questions/24924072/website-url-validation-regex-in-java/37864510
    private static final Pattern WSS_REGEX_PATTERN =
            Pattern.compile("wss:\\/\\/(www\\.)?([\\w]+\\.)+[‌​\\w]{2,63}(:[0-9]+)?\\/?");

    private ExtensionHUD extHud;

    private Logger LOG = Logger.getLogger(this.getClass());

    public HttpUpgradeProxyListener(ExtensionHUD extHud) {
        this.extHud = extHud;
    }

    @Override
    public int getArrangeableListenerOrder() {
        return 0;
    }

    @Override
    public boolean onHttpRequestSend(HttpMessage msg) {
        if (this.extHud.isHudEnabled()) {
            if (this.extHud.getHudParam().isInScopeOnly() && !msg.isInScope()) {
                return false;
            }
            try {
                if (!msg.getRequestHeader().isSecure()) {
                    // 302 to the https version..
                    this.extHud.addUpgradedHttpsDomain(msg.getRequestHeader().getURI());
                    msg.setResponseHeader(
                            HudAPI.getAllowFramingResponseHeader(
                                    "302 OK", "text/html; charset=UTF-8", 0, false));
                    String url =
                            msg.getRequestHeader()
                                    .getURI()
                                    .toString()
                                    .replaceFirst("(?i)http://", "https://");
                    msg.getResponseHeader().addHeader(HttpHeader.LOCATION, url);
                    // Don't strictly need the body
                    msg.setResponseBody("<html><body>Redirecting to " + url + "</body></html>");
                    msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
                    LOG.debug("onHttpRequestSend returning a 302 to " + url);
                    return true;
                } else {
                    if (this.extHud.isUpgradedHttpsDomain(msg.getRequestHeader().getURI())) {
                        // Switch to using the HTTP version in the background
                        msg.getRequestHeader().setSecure(false);
                    }
                }
            } catch (Exception e) {
                LOG.error(e.getMessage(), e);
            }
        }
        return false;
    }

    @Override
    public boolean onHttpResponseReceived(HttpMessage msg) {
        if (this.extHud.isHudEnabled()) {
            try {
                URI url = msg.getRequestHeader().getURI();
                if ((msg.getResponseHeader().getStatusCode() == 301
                                || msg.getResponseHeader().getStatusCode() == 302)
                        && this.extHud.isUpgradedHttpsDomain(url)) {
                    String loc = msg.getResponseHeader().getHeader(HttpResponseHeader.LOCATION);
                    if (loc != null && loc.toLowerCase().startsWith("https")) {
                        // We've upgraded it, but its upgrading itself anyway - let it do that so we
                        // dont get into a browser loop
                        LOG.debug("onHttpResponseReceived not upgrading " + url);
                        this.extHud.removeUpgradedHttpsDomain(url);
                        // Advise that we're no longer upgrading this domain to https
                        Map<String, String> map = new HashMap<>();
                        map.put(
                                HudEventPublisher.FIELD_DOMAIN,
                                ExtensionHUD.getNormalisedDomain(url));
                        ZAP.getEventBus()
                                .publishSyncEvent(
                                        HudEventPublisher.getPublisher(),
                                        new Event(
                                                HudEventPublisher.getPublisher(),
                                                HudEventPublisher.EVENT_DOMAIN_REDIRECTED_TO_HTTPS,
                                                null,
                                                map));
                    }
                }
                if (msg.getResponseHeader().isText() && this.extHud.isUpgradedHttpsDomain(url)) {
                    String domain = ExtensionHUD.getNormalisedDomain(url);
                    String respBody = msg.getResponseBody().toString();
                    if (respBody.contains("http://" + domain)) {
                        // Need to replace hardcoded http URLs with https ones
                        msg.getResponseBody()
                                .setBody(respBody.replace("http://" + domain, "https://" + domain));
                        msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
                    }
                    if (respBody.contains("ws://")) {
                        // Need to replace hardcoded ws URLs with wss ones
                        String body = respBody.replace("ws://", "wss://");
                        // Now extract all of the wss urls to flag them as upgraded
                        for (URI uri : extractWssUrls(body)) {
                            LOG.debug("Adding upgraded ws URL: " + uri);
                            extHud.addUpgradedHttpsDomain(uri);
                        }
                        msg.getResponseBody().setBody(body);
                        msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
                    }
                }
            } catch (URIException e) {
                LOG.error(e.getMessage(), e);
            }
        }
        return false;
    }

    protected static List<URI> extractWssUrls(String str) {
        List<URI> list = new ArrayList<>();
        Matcher m = WSS_REGEX_PATTERN.matcher(str);
        while (m.find()) {
            String wsUrl = m.group();
            try {
                list.add(new URI(wsUrl, false));
            } catch (URIException e) {
                // Not a valid url, ignore it
            }
        }
        return list;
    }
}
