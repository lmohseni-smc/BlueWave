package bluewave.auth;

import static org.junit.jupiter.api.Assertions.*;

class LDAPTest {

    public static final int EXPECTED_PORT = 389;
    LDAP ldap;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        ldap = new LDAP();
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
    }

    @org.junit.jupiter.api.Test
    void setHostColon() {
        ldap.setHost("abc:123");
        assertEquals("abc",ldap.host);
        assertEquals(123,ldap.port);
    }

    @org.junit.jupiter.api.Test
    void setHostNoColon() {
        ldap.setHost("abc");
        assertEquals("abc",ldap.host);
        assertEquals(EXPECTED_PORT,ldap.port);
    }

    @org.junit.jupiter.api.Test
    void setDomain() {
        ldap.setDomain("abc");
        assertEquals("dc=abc",ldap.dc);
    }

    @org.junit.jupiter.api.Test
    void authenticate() {
    }
}