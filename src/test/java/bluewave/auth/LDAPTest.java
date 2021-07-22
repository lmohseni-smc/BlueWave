package bluewave.auth;


import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.Assert.assertEquals;

class LDAPTest {

    public static final int EXPECTED_PORT = 389;
    LDAP ldap;

    @BeforeEach
    void setUp() {
        ldap = new LDAP();
    }

    @AfterEach
    void tearDown() {
    }

    @Test
    void setHostColon() {
        ldap.setHost("abc:123");
        assertEquals("abc",ldap.host);
        assertEquals(123,ldap.port);
    }

    @Test
    void setHostNoColon() {
        ldap.setHost("abc");
        assertEquals("abc",ldap.host);
        assertEquals(EXPECTED_PORT,ldap.port);
    }

    @Test
    void setDomain() {
        ldap.setDomain("abc");
        assertEquals("dc=abc",ldap.dc);
    }

    @org.junit.jupiter.api.Test
    void authenticate() {
    }
}